import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerSupabase } from '@/lib/supabase/server'
import ProfileCard from '@/components/account/ProfileCard'
import RecentOrders, { type OrderView } from '@/components/account/RecentOrders'
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
}

interface AddressRow {
  id:          string
  street:      string | null
  postal_code: string | null
  city:        string | null
}

interface OrderItemRow {
  product_name:    string
  product_slug:    string | null
  shop_product_id: string | null
  weight:          number
  quantity:        number
  line_total:      number
  grind:           string | null
  grind_option:    string | null
  // supabase-js infers this embed as an array (no generated DB types), but at
  // runtime PostgREST returns a to-one embed as a single object. Accept both;
  // read the value via crmProductId() which handles either shape.
  shop_products:   { crm_product_id: string | null } | { crm_product_id: string | null }[] | null
}

// Normalise the shop_products embed (object at runtime, array per TS inference).
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

// Mirrors loyalty_config (classic_discount/gold_discount/platinum_discount
// and gold_threshold/platinum_threshold), computed server-side by recalc_loyalty
// off spent_12m — kept here in sync rather than queried, since these
// thresholds rarely change and this avoids an extra round trip.
const DISCOUNT_PCT = { classic: 5, gold: 10, platinum: 15 }
const NEXT_THRESHOLD = { classic: 600, gold: 1800, platinum: null }
const NEXT_TIER = { classic: 'gold', gold: 'platinum', platinum: null } as const

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
  let address: AddressRow | null = null
  // Maps `${shop_order_id}|${crm_product_id}|${weight}` → all qr_tokens of the
  // matching CRM orders. One CRM order (and qr_token) exists per physical unit,
  // so a qty>N position collects N tokens → one QR button per unit.
  const qrByKey = new Map<string, string[]>()

  try {
    const [shopUserRes, ordersRes] = await Promise.all([
      supabase.from('shop_users')
        .select('id, name, phone, created_at, consent_email_marketing, consent_sms_marketing, loyalty_level, spent_12m')
        .eq('email', email)
        .single(),
      supabase.from('shop_orders')
        .select('id, order_number, total, status, created_at, shop_order_items(product_name, product_slug, shop_product_id, weight, quantity, line_total, grind, grind_option, shop_products(crm_product_id))')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (!shopUserRes.error) shopUser = shopUserRes.data
    if (!ordersRes.error) recentOrders = ordersRes.data ?? []

    // Pull qr_token + match key from the CRM `orders` mirror for these orders.
    // `orders` is now staff-only under RLS, so go through a SECURITY DEFINER RPC
    // scoped to auth.uid() (returns only tokens for the caller's own orders).
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

  // Flatten to a client-serialisable shape with qr_tokens pre-attached per item;
  // the RecentOrders client component then live-updates order status.
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
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl bg-[#F4F3F0] p-4 md:p-8">

      {/* 1. Welcome / loyalty block */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.6)] px-5 py-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 truncate text-[15px] font-semibold text-[#3A2115]">
            {firstName ? `${t('welcome')}, ${firstName}` : `${t('welcome')}!`}
          </p>
          <span className="shrink-0 rounded-full border border-[rgba(65,38,24,0.2)] bg-[rgba(255,255,255,0.5)] px-3 py-1 text-xs font-semibold text-[#412618] backdrop-blur">
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
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: '#412618' }}
              />
            </div>
            <p className="mt-1.5 text-sm text-gray-600">
              🎁 {t('reward_line', { pct: DISCOUNT_PCT[nextTierKey] })}
            </p>
          </div>
        ) : (
          <div className="mt-2.5">
            <p className="text-[17px] font-bold text-[#412618]">{t('max_level_title')}</p>
            <p className="mt-0.5 text-sm text-gray-600">{t('max_level_desc', { pct: tierPct })}</p>
          </div>
        )}
      </div>

      {/* 2. Recent orders — live status via Realtime + polling */}
      <RecentOrders locale={locale} shopUserId={shopUser?.id ?? null} initialOrders={orderViews} />

      {/* 3. Profile data — editable name + address */}
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
  )
}
