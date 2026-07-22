import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getReviewData, getReferralStats } from '@/lib/account/dashboard'
import ProfileCard from '@/components/account/ProfileCard'
import OrdersAccordion, { type OrderRow as AccOrder } from '@/components/account/OrdersAccordion'
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

interface DbOrderItem {
  product_name:    string
  product_slug:    string | null
  shop_product_id: string | null
  weight:          number
  quantity:        number
  line_total:      number
  grind:           string | null
  grind_option:    string | null
}
interface DbOrderRow {
  id:               string
  order_number:     number
  total:            number
  status:           string
  created_at:       string
  updated_at:       string
  source:           string | null
  delivery_type:    string | null
  delivery_address: Record<string, string> | null
  tracking_number:  string | null
  shop_order_items: DbOrderItem[] | null
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
  let recentOrders: DbOrderRow[] = []
  let subs: SubRow[] = []
  let address: AddressRow | null = null
  let ordersCount = 0

  try {
    const [shopUserRes, ordersRes, ordersCountRes, subsRes] = await Promise.all([
      supabase.from('shop_users')
        .select('id, name, phone, created_at, consent_email_marketing, consent_sms_marketing, loyalty_level, spent_12m, referral_code')
        .eq('email', email)
        .single(),
      supabase.from('shop_orders')
        .select('id, order_number, total, status, created_at, updated_at, source, delivery_type, delivery_address, tracking_number, shop_order_items(product_name, product_slug, shop_product_id, weight, quantity, line_total, grind, grind_option)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('shop_orders').select('id', { count: 'exact', head: true }).eq('customer_email', email),
      supabase.from('subscriptions')
        .select('id, status, items, interval_weeks, next_delivery_date, cancelled_at')
        .order('created_at', { ascending: false }),
    ])

    if (!shopUserRes.error) shopUser = shopUserRes.data
    if (!ordersRes.error) recentOrders = (ordersRes.data as DbOrderRow[]) ?? []
    ordersCount = ordersCountRes.count ?? 0
    if (!subsRes.error) subs = (subsRes.data as SubRow[]) ?? []

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

  // Hero subline — smart contextual message by priority.
  const DAY = 86_400_000
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)

  // P1: nearest active-subscription delivery date.
  const nearestActiveDate = subs
    .filter(s => s.status === 'active' && s.next_delivery_date)
    .map(s => s.next_delivery_date)
    .sort()[0] ?? null
  // P2: order currently in transit.
  const transitOrder = recentOrders.find(o => o.status === 'processing' || o.status === 'shipped')
  // P3: order delivered within the last 7 days.
  const recentlyDelivered = recentOrders.some(o =>
    o.status === 'delivered' && new Date(o.updated_at).getTime() >= Date.now() - 7 * DAY,
  )

  let heroSub: string
  if (nearestActiveDate) {
    const days = Math.round((new Date(`${nearestActiveDate}T00:00:00`).getTime() - startToday.getTime()) / DAY)
    heroSub = days <= 0 ? t('hero_sub_today') : days === 1 ? t('hero_sub_tomorrow') : t('hero_sub_days', { n: days })
  } else if (transitOrder) {
    heroSub = t('hero_sub_transit', { n: transitOrder.order_number })
  } else if (recentlyDelivered) {
    heroSub = t('hero_sub_review')
  } else if (tier !== 'classic') {
    heroSub = t('hero_sub_status', { tier: t(`tier_${tier}`), pct: tierPct })
  } else {
    heroSub = t('hero_sub_default')
  }

  const orderRows: AccOrder[] = recentOrders.map(order => ({
    id:               order.id,
    order_number:     order.order_number,
    total:            order.total,
    status:           order.status,
    created_at:       order.created_at,
    source:           order.source ?? null,
    delivery_type:    order.delivery_type ?? null,
    delivery_address: order.delivery_address ?? null,
    tracking_number:  order.tracking_number ?? null,
    items: (order.shop_order_items ?? []).map(item => ({
      product_name:    item.product_name,
      product_slug:    item.product_slug,
      shop_product_id: item.shop_product_id,
      weight:          item.weight,
      quantity:        item.quantity,
      line_total:      item.line_total,
      grind:           item.grind,
      grind_option:    item.grind_option,
    })),
  }))

  const reviewedProductIds = reviewData.myReviews.map(r => r.product_id)

  const CARD = 'rounded-2xl border border-gray-200 border-t-2 border-t-[#412618] bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md'

  return (
    <div className="mx-auto max-w-4xl space-y-8 md:space-y-10">

      {/* 1. Hero greeting — plain text, no plate */}
      <section className="animate-fade-up px-1 pt-1" style={{ animationDelay: '0ms' }}>
        <h1 className="text-3xl font-semibold tracking-tight text-[#412618] md:text-4xl">
          {firstName ? `${t('hero_welcome_back')}, ${firstName}` : t('hero_welcome_back')}
        </h1>
        <p className="mt-2 text-base text-gray-500">{heroSub}</p>
      </section>

      {/* 2. Active subscriptions */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <ActiveSubscriptions locale={locale} initialSubs={activeSubs} />
      </div>

      {/* 3. Loyalty card */}
      <section className={`animate-fade-up ${CARD}`} style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] font-semibold text-[#3A2115]">{t('loyalty_title')}</p>
          <span className="shrink-0 rounded-full border border-[#412618]/30 bg-white px-3 py-1 text-xs font-semibold text-[#412618]">
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
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, backgroundColor: '#412618' }} />
            </div>
            <p className="mt-1.5 text-sm text-gray-500">🎁 {t('reward_line', { pct: DISCOUNT_PCT[nextTierKey] })}</p>
          </div>
        ) : (
          <div className="mt-2.5">
            <p className="text-[17px] font-bold text-[#412618]">{t('max_level_title')}</p>
            <p className="mt-0.5 text-sm text-gray-500">{t('max_level_desc', { pct: tierPct })}</p>
          </div>
        )}
      </section>

      {/* 4. Reviews (hidden when nothing to review and no history) */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <ReviewsSection
          toReview={reviewData.toReview}
          myReviews={reviewData.myReviews}
          authorName={shopUser?.name ?? ''}
          email={email}
        />
      </div>

      {/* 5. Referral program */}
      {shopUser?.referral_code && (
        <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
          <ReferralCard
            locale={locale}
            code={shopUser.referral_code}
            invited={referralStats.invited}
            available={referralStats.available}
          />
        </div>
      )}

      {/* 6. Orders — compact accordion */}
      <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
        <OrdersAccordion
          locale={locale}
          orders={orderRows}
          totalCount={ordersCount}
          reviewedProductIds={reviewedProductIds}
          authorName={shopUser?.name ?? ''}
          email={email}
        />
      </div>

      {/* 7. Profile */}
      <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
        <ProfileCard
          initialName={shopUser?.name ?? ''}
          email={email}
          phone={shopUser?.phone ?? ''}
          registeredDate={registeredDate}
          consentEmail={!!shopUser?.consent_email_marketing}
          consentSms={!!shopUser?.consent_sms_marketing}
          initialAddress={address}
        />
      </div>

      {/* 8. Archive */}
      <div className="animate-fade-up" style={{ animationDelay: '420ms' }}>
        <AccountArchive
          locale={locale}
          cancelledSubs={cancelledSubs}
          ordersCount={ordersCount}
          reviewsCount={reviewData.myReviews.length}
        />
      </div>

      {/* 9. Logout */}
      <LogoutFooter locale={locale} />
    </div>
  )
}
