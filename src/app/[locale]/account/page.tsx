import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fmtPrice } from '@/lib/pricing'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale }
}

interface ShopUserRow {
  name:                      string | null
  phone:                    string | null
  created_at:               string
  consent_email_marketing:  boolean | null
  consent_sms_marketing:    boolean | null
  loyalty_level:             'classic' | 'gold' | 'platinum'
  spent_12m:                 number
}

interface OrderRow {
  id:           string
  order_number: number
  total:        number
  status:       string
  created_at:   string
}

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

  try {
    const [shopUserRes, ordersRes] = await Promise.all([
      supabase.from('shop_users')
        .select('name, phone, created_at, consent_email_marketing, consent_sms_marketing, loyalty_level, spent_12m')
        .eq('email', email)
        .single(),
      supabase.from('shop_orders')
        .select('id, order_number, total, status, created_at')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (!shopUserRes.error) shopUser = shopUserRes.data
    if (!ordersRes.error) recentOrders = ordersRes.data ?? []
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

  const regDate = new Date(user.created_at)
  const registeredDate = `${String(regDate.getDate()).padStart(2, '0')}.${String(regDate.getMonth() + 1).padStart(2, '0')}.${regDate.getFullYear()}`

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl bg-[#F4F3F0] p-4 md:p-8">

      {/* 1. Welcome / loyalty block */}
      <div className="flex min-h-[80px] items-center justify-between gap-4 rounded-2xl border border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.6)] px-5 py-4 shadow-sm backdrop-blur-xl">
        <p className="min-w-0 truncate text-[15px] font-semibold text-[#3A2115]">
          {firstName ? `${t('welcome')}, ${firstName}` : `${t('welcome')}!`}
        </p>

        <span className="shrink-0 rounded-full border border-[rgba(65,38,24,0.2)] bg-[rgba(255,255,255,0.5)] px-3 py-1 text-xs font-semibold text-[#412618] backdrop-blur">
          {t(`tier_${tier}`)} · {tierPct}%
        </span>

        <div className="w-[120px] shrink-0">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, backgroundColor: '#412618' }}
            />
          </div>
          <p className="mt-1 truncate text-[11px] text-brand-muted">
            {nextThreshold && nextTierKey
              ? t('progress_remaining', { amount: fmtPrice(remainingToNext), next: t(`tier_${nextTierKey}`), pct: DISCOUNT_PCT[nextTierKey] })
              : t('max_level')}
          </p>
        </div>
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
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    #{order.order_number}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t(`status_${order.status}`)}
                    </span>
                  </p>
                  <p className="text-sm text-brand-muted">
                    {new Date(order.created_at).toLocaleDateString(DATE_LOCALE[locale])}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">{fmtPrice(order.total)}</p>
                  <button type="button" className="btn btn-outline text-sm">{t('buy_again')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Profile data */}
      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="mb-4 text-[18px] font-bold uppercase text-[#3A2115]">{t('profile_title')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-brand-muted">{t('email_label')}</p>
            <p className="font-medium">{email}</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">{t('phone_label')}</p>
            <p className="font-medium">{shopUser?.phone || t('not_provided')}</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">{t('registered_label')}</p>
            <p className="font-medium">{registeredDate}</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">{t('consents_label')}</p>
            <p className="font-medium">
              {t('consent_email_label')}: {shopUser?.consent_email_marketing ? t('consent_yes') : t('consent_no')}
              {' · '}
              {t('consent_sms_label')}: {shopUser?.consent_sms_marketing ? t('consent_yes') : t('consent_no')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
