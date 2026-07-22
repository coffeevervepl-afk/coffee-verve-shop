import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getReviewData, getReferralStats } from '@/lib/account/dashboard'
import ProfileCard from '@/components/account/ProfileCard'
import RecentOrders, { type OrderView } from '@/components/account/RecentOrders'
import ActiveSubscriptions, { type DashSub } from '@/components/account/ActiveSubscriptions'
import ReviewsSection from '@/components/account/ReviewsSection'
import ReferralCard from '@/components/account/ReferralCard'
import AccountArchive, { type ArchSub } from '@/components/account/AccountArchive'
import LogoutFooter from '@/components/account/LogoutFooter'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale }
}

interface ShopUserRow {
  id:                        string
  name:                      string | null
  phone:                    string | null
  created_at:               string
  consent_email_marketing:  boolean | null
  consent_sms_marketing:    boolean | null
  loyalty_level:             'classic' | 'gold' | 'platinum'
  spent_12m:                 number
  referral_code:             string | null
}

interface AddressRow { id: string; street: string | null; postal_code: string | null; city: string | null }

interface OrderItemRow {
  product_name:    string
  product_slug:    string | null
  shop_product_id: string | null
  weight:          number
  quantity:        number
  line_total:      number
  grind:           string | null
  grind_option:    string | null
  shop_products:   { crm_product_id: string | null } | { crm_product_id: string | null }[] | null
}

function crmProductId(sp: OrderItemRow['shop_products']): string | null {
  if (!sp) return null
  return Array.isArray(sp) ? sp[0]?.crm_product_id ?? null : sp.crm_product_id
}

interface OrderRow {
  id:                string
  order_number:      number
  total:             number
  status:            string
  created_at:        string
  shop_order_items:  OrderItemRow[] | null
}

interface SubRow {
  id:                 string
  status:             'active' | 'paused' | 'cancelled'
  items:              { name: string; weight: number; grind: string; quantity: number }[]
  interval_weeks:     number
  next_delivery_date: string
  cancelled_at:       string | null
}

const DISCOUNT_PCT   = { classic: 5, gold: 10, platinum: 15 }
const NEXT_THRESHOLD = { classic: 600, gold: 1800, platinum: null }
const NEXT_TIER      = { classic: 'gold', gold: 'platinum', platinum: null } as const
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }

export default async function AccountPage({ params }: Props) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect(`/${locale}/account/login`)
  }

  const email = user.email

  let shopUser: ShopUserRow | null = null
  let recentOrders: OrderRow[] = []
  let subs: SubRow[] = []
  let address: AddressRow | null = null
  let ordersCount = 0
  const qrByKey = new Map<string, string[]>()

  try {
    const [shopUserRes, ordersRes, ordersCountRes, subsRes] = await Promise.all([
      supabase.from('shop_users')
        .select('id, name, phone, created_at, consent_email_marketing, consent_sms_marketing, loyalty_level, spent_12m, referral_code')
        .eq('email', email)
        .single(),
      supabase.from('shop_orders')
        .select('id, order_number, total, status, created_at, shop_order_items(product_name, product_slug, shop_product_id, weight, quantity, line_total, grind, grind_option, shop_products(crm_product_id))')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('shop_orders').select('id', { count: 'exact', head: true }).eq('customer_email', email),
      supabase.from('subscriptions')
        .select('id, status, items, interval_weeks, next_delivery_date, cancelled_at')
        .order('created_at', { ascending: false }),
    ])

    if (!shopUserRes.error) shopUser = shopUserRes.data
    if (!ordersRes.error) recentOrders = ordersRes.data ?? []
    ordersCount = ordersCountRes.count ?? 0
    if (!subsRes.error) subs = (subsRes.data as SubRow[]) ?? []

    if (recentOrders.length > 0) {
      const orderIds = recentOrders.map(o => o.id)
      const crmRes = await supabase.rpc('get_qr_tokens_for_orders', { p_shop_order_ids: orderIds })
      const rows = (crmRes.data ?? []) as { shop_order_id: string; product_id: string; weight: number; qr_token: string }[]
      if (!crmRes.error) {
        for (const r of rows) {
          if (!r.qr_token) continue
          const key = `${r.shop_order_id}|${r.product_id}|${r.weight}`
          const tokens = qrByKey.get(key)
          if (tokens) tokens.push(r.qr_token)
          else qrByKey.set(key, [r.qr_token])
        }
      }
    }

    if (shopUser) {
      const addrRes = await supabase.from('shop_addresses')
        .select('id, street, postal_code, city')
        .eq('shop_user_id', shopUser.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!addrRes.error) address = addrRes.data
    }
  } catch {
    // Keep defaults — render placeholders instead of crashing.
  }

  // Referral + review data (service-role reads, scoped to this user).
  const [referralStats, reviewData] = await Promise.all([
    getReferralStats(user.id).catch(() => ({ invited: 0, available: 0 })),
    getReviewData(email, locale).catch(() => ({ toReview: [], myReviews: [] })),
  ])

  const firstName = shopUser?.name?.trim().split(/\s+/)[0] || ''
  const tier = shopUser?.loyalty_level ?? 'classic'
  const tierPct = DISCOUNT_PCT[tier]
  const spent = shopUser?.spent_12m ?? 0
  const nextThreshold = NEXT_THRESHOLD[tier]
  const nextTierKey = NEXT_TIER[tier]
  const progressPct = nextThreshold ? Math.min(100, Math.round((spent / nextThreshold) * 100)) : 100
  const remainingToNext = nextThreshold ? Math.max(nextThreshold - spent, 0) : 0
  const remainingFormatted = remainingToNext.toFixed(2).replace('.', ',')

  const regDate = new Date(user.created_at)
  const registeredDate = `${String(regDate.getDate()).padStart(2, '0')}.${String(regDate.getMonth() + 1).padStart(2, '0')}.${regDate.getFullYear()}`

  // Split subscriptions.
  const activeSubs: DashSub[] = subs
    .filter(s => s.status === 'active' || s.status === 'paused')
    .map(s => ({ id: s.id, status: s.status, items: s.items ?? [], interval_weeks: s.interval_weeks, next_delivery_date: s.next_delivery_date }))
  const cancelledSubs: ArchSub[] = subs
    .filter(s => s.status === 'cancelled')
    .map(s => ({ id: s.id, items: s.items ?? [], interval_weeks: s.interval_weeks, cancelled_at: s.cancelled_at }))

  // Greeting by Warsaw time-of-day.
  const hourPL = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hour12: false }).format(new Date()))
  const greetKey = hourPL < 12 ? 'greet_morning' : hourPL < 18 ? 'greet_day' : 'greet_evening'

  // Hero subline priority: soon subscription → in-transit order → default.
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const soonDate = subs
    .filter(s => s.status === 'active' && s.next_delivery_date)
    .map(s => s.next_delivery_date)
    .sort()
    .find(d => { const dt = new Date(d); return dt >= startToday && dt.getTime() - startToday.getTime() <= 7 * 86_400_000 })
  const transitOrder = recentOrders.find(o => o.status === 'processing' || o.status === 'shipped')
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE[locale])

  let heroSub: string
  if (soonDate) heroSub = t('hero_sub_coming', { date: fmtDate(soonDate) })
  else if (transitOrder) heroSub = t('hero_sub_transit', { n: transitOrder.order_number })
  else heroSub = t('hero_sub_default')

  const orderViews: OrderView[] = recentOrders.map(order => ({
    id:           order.id,
    order_number: order.order_number,
    total:        order.total,
    status:       order.status,
    created_at:   order.created_at,
    items: (order.shop_order_items ?? []).map(item => ({
      product_name:    item.product_name,
      product_slug:    item.product_slug,
      shop_product_id: item.shop_product_id,
      weight:          item.weight,
      quantity:        item.quantity,
      line_total:      item.line_total,
      grind:           item.grind,
      grind_option:    item.grind_option,
      tokens:          qrByKey.get(`${order.id}|${crmProductId(item.shop_products)}|${item.weight}`) ?? [],
    })),
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-3xl bg-[#F4F3F0] p-4 md:p-8">

      {/* 1. Hero greeting */}
      <section className="rounded-3xl bg-[#412618] px-6 py-7 text-white shadow-sm">
        <h1 className="text-2xl font-bold">{firstName ? `${t(greetKey)}, ${firstName}` : t(greetKey)}</h1>
        <p className="mt-1.5 text-sm text-white/80">{heroSub}</p>
      </section>

      {/* 2. Active subscriptions */}
      <ActiveSubscriptions locale={locale} initialSubs={activeSubs} />

      {/* 3. Reviews (hidden when nothing to review and no history) */}
      <ReviewsSection
        toReview={reviewData.toReview}
        myReviews={reviewData.myReviews}
        authorName={shopUser?.name ?? ''}
        email={email}
      />

      {/* 4. Referral program */}
      {shopUser?.referral_code && (
        <ReferralCard
          locale={locale}
          code={shopUser.referral_code}
          invited={referralStats.invited}
          available={referralStats.available}
        />
      )}

      {/* 5. Recent orders */}
      <div>
        <RecentOrders locale={locale} shopUserId={shopUser?.id ?? null} initialOrders={orderViews} />
        {ordersCount > orderViews.length && (
          <Link href={`/${locale}/account/orders`} className="mt-3 block text-center text-sm font-medium text-[#412618] underline underline-offset-2">
            {t('see_all_orders', { n: ordersCount })}
          </Link>
        )}
      </div>

      {/* 6. Loyalty card */}
      <section className="rounded-2xl border border-brand-border bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] font-semibold text-[#3A2115]">{t('loyalty_title')}</p>
          <span className="shrink-0 rounded-full border border-[rgba(65,38,24,0.2)] bg-[#F4F3F0] px-3 py-1 text-xs font-semibold text-[#412618]">
            {t(`tier_${tier}`)} · {tierPct}%
          </span>
        </div>
        {nextThreshold && nextTierKey ? (
          <div className="mt-2.5">
            <p className="text-[15px] leading-tight text-[#3A2115]">
              {t.rich('progress_line', {
                amount: remainingFormatted,
                next: t(`tier_${nextTierKey}`),
                big: chunks => <span className="text-[22px] font-bold text-[#412618]">{chunks}</span>,
              })}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, backgroundColor: '#412618' }} />
            </div>
            <p className="mt-1.5 text-sm text-gray-600">🎁 {t('reward_line', { pct: DISCOUNT_PCT[nextTierKey] })}</p>
          </div>
        ) : (
          <div className="mt-2.5">
            <p className="text-[17px] font-bold text-[#412618]">{t('max_level_title')}</p>
            <p className="mt-0.5 text-sm text-gray-600">{t('max_level_desc', { pct: tierPct })}</p>
          </div>
        )}
      </section>

      {/* 7. Profile */}
      <ProfileCard
        initialName={shopUser?.name ?? ''}
        email={email}
        phone={shopUser?.phone ?? ''}
        registeredDate={registeredDate}
        consentEmail={!!shopUser?.consent_email_marketing}
        consentSms={!!shopUser?.consent_sms_marketing}
        initialAddress={address}
      />

      {/* 8. Archive */}
      <AccountArchive
        locale={locale}
        cancelledSubs={cancelledSubs}
        ordersCount={ordersCount}
        reviewsCount={reviewData.myReviews.length}
      />

      {/* 9. Logout */}
      <LogoutFooter locale={locale} />
    </div>
  )
}
