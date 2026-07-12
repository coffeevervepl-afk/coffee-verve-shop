import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fmtPrice } from '@/lib/pricing'
import ProfileCard from '@/components/account/ProfileCard'
import BuyAgainButton from '@/components/account/BuyAgainButton'
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
  // supabase-js (no generated DB types) infers this embed as an array, so match
  // that shape here and read the first element when mapping to a qr_token.
  shop_products:   { crm_product_id: string | null }[] | null
}

interface OrderRow {
  id:                string
  order_number:      number
  total:             number
  status:            string
  created_at:        string
  shop_order_items:  OrderItemRow[] | null
}

// Passport ("паспорт товара") lives on the CRM domain. Falls back to the
// production URL so the QR link works even if the env var isn't set.
const CRM_URL = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://coffe-verve-crm.vercel.app'

// Known grind_option values that have a translation key (grind_opt_*).
const GRIND_OPTS = ['espresso', 'aeropress', 'pourover', 'frenchpress', 'turka', 'moka']

const STATUS_STYLES: Record<string, string> = {
  new:        'bg-gray-100 text-gray-600',
  confirmed:  'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-orange-100 text-orange-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }

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
    if (recentOrders.length > 0) {
      const orderIds = recentOrders.map(o => o.id)
      const crmRes = await supabase.from('orders')
        .select('shop_order_id, product_id, weight, qr_token')
        .in('shop_order_id', orderIds)
      if (!crmRes.error) {
        for (const r of crmRes.data ?? []) {
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

      {/* 2. Recent orders */}
      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="mb-4 text-[18px] font-bold uppercase text-[#3A2115]">{t('recent_orders_title')}</h2>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-brand-muted">{t('no_orders')}</p>
            <Link href={`/${locale}`} className="btn btn-primary">{t('go_to_catalog')}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => {
              const delivered = order.status === 'delivered'
              return (
                <div key={order.id} className="rounded-xl border border-brand-border p-4">
                  {/* header: order number + status (once per order) */}
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    #{order.order_number}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t(`status_${order.status}`)}
                    </span>
                  </p>

                  {/* items — one row per physical unit (qty>1 → several rows) */}
                  {order.shop_order_items && order.shop_order_items.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {order.shop_order_items.flatMap((item, i) => {
                        // One CRM order (qr_token) per physical unit.
                        const qrTokens = qrByKey.get(`${order.id}|${item.shop_products?.[0]?.crm_product_id}|${item.weight}`) ?? []
                        const perPack = fmtPrice(item.line_total / item.quantity)
                        // Grind label: "Зёрна" / "Молотый" / "Молотый (эспрессо)".
                        const grindText =
                          item.grind === 'whole'
                            ? t('grind_whole')
                            : item.grind === 'ground'
                              ? (item.grind_option && GRIND_OPTS.includes(item.grind_option)
                                  ? `${t('grind_ground')} (${t(`grind_opt_${item.grind_option}`)})`
                                  : t('grind_ground'))
                              : ''
                        // QR availability depends ONLY on weight (250g = tasting guarantee).
                        const showQr = item.weight === 250
                        return Array.from({ length: item.quantity }).map((_, u) => {
                          const token = qrTokens[u]
                          return (
                            <li key={`${i}-${u}`} className="flex items-center justify-between gap-2 leading-tight">
                              <span className="min-w-0 truncate">
                                <span className="text-[13px] font-medium text-[#3A2115]">{item.product_name}</span>
                                <span className="text-xs text-gray-500"> · {item.weight}г — {perPack}{grindText ? ` · ${grindText}` : ''}</span>
                              </span>
                              {/* Two fixed slots so buttons line up across rows regardless of QR presence. */}
                              <span className="flex shrink-0 items-center gap-1.5">
                                <BuyAgainButton
                                  locale={locale}
                                  shopProductId={item.shop_product_id}
                                  slug={item.product_slug}
                                  weight={item.weight}
                                  grind={item.grind}
                                  grindOption={item.grind_option}
                                />
                                <span className="flex w-9 justify-end">
                                  {showQr && (
                                    delivered && token ? (
                                      <a
                                        href={`${CRM_URL}/passport/${token}?lang=${locale}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-full border border-[#412618] px-2 py-0.5 text-[11px] font-medium text-[#412618]"
                                      >
                                        QR
                                      </a>
                                    ) : (
                                      <span
                                        aria-disabled="true"
                                        title={t('qr_after_delivery')}
                                        className="cursor-not-allowed rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-300"
                                      >
                                        QR
                                      </span>
                                    )
                                  )}
                                </span>
                              </span>
                            </li>
                          )
                        })
                      })}
                    </ul>
                  )}

                  {/* footer: date · order total */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-brand-muted">
                      {new Date(order.created_at).toLocaleDateString(DATE_LOCALE[locale])}
                    </span>
                    <span className="text-sm font-bold text-[#3A2115]">{fmtPrice(order.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
