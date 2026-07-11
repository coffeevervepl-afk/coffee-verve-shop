import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Package, ShieldCheck, Settings } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase/server'
import { fmtPrice } from '@/lib/pricing'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale }
}

interface ShopUserRow {
  phone:                    string | null
  created_at:               string
  consent_email_marketing:  boolean | null
  consent_sms_marketing:    boolean | null
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

function getTier(orderCount: number) {
  if (orderCount >= 10) return 'gold' as const
  if (orderCount >= 3)  return 'silver' as const
  return 'classic' as const
}

const TIER_PCT   = { classic: 0, silver: 5, gold: 10 }
const TIER_COLOR = { classic: '#9C9C9C', silver: '#B8BCC2', gold: '#C47B2A' }

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
  let orderCount = 0
  let recentOrders: OrderRow[] = []

  try {
    const [shopUserRes, countRes, ordersRes] = await Promise.all([
      supabase.from('shop_users')
        .select('phone, created_at, consent_email_marketing, consent_sms_marketing')
        .eq('email', email)
        .single(),
      supabase.from('shop_orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', email),
      supabase.from('shop_orders')
        .select('id, order_number, total, status, created_at')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (!shopUserRes.error) shopUser = shopUserRes.data
    if (!countRes.error) orderCount = countRes.count ?? 0
    if (!ordersRes.error) recentOrders = ordersRes.data ?? []
  } catch {
    // Keep defaults — render placeholders instead of crashing.
  }

  const emailName = email.split('@')[0]
  const tier = getTier(orderCount)
  const tierPct = TIER_PCT[tier]
  const tierColor = TIER_COLOR[tier]
  const nextThreshold = tier === 'classic' ? 3 : tier === 'silver' ? 10 : null
  const progressPct = nextThreshold ? Math.min(100, Math.round((orderCount / nextThreshold) * 100)) : 100
  const nextTierKey = tier === 'classic' ? 'silver' : 'gold'

  const registeredDate = shopUser?.created_at
    ? new Date(shopUser.created_at).toLocaleDateString(DATE_LOCALE[locale])
    : '—'

  const quickActions = [
    { href: `/${locale}/account/orders`,    icon: Package,     label: t('quick_orders') },
    { href: `/${locale}/account/guarantee`, icon: ShieldCheck, label: t('quick_guarantee') },
    { href: `/${locale}/account/settings`,  icon: Settings,    label: t('quick_settings') },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl bg-[#F4F3F0] p-4 md:p-8">

      {/* 1. Welcome / loyalty block */}
      <div className="rounded-2xl bg-[#3A2115] p-6 text-white md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold md:text-xl">{t('welcome')}, {emailName}</p>

            <span
              className="mt-4 inline-block rounded-full px-3 py-1 text-[13px] font-bold"
              style={{ backgroundColor: tierColor, color: tier === 'gold' ? '#fff' : '#2A2620' }}
            >
              {t(`tier_${tier}`)} • {tierPct}%
            </span>

            <div className="mt-3 max-w-[240px]">
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, backgroundColor: tierColor }}
                />
              </div>
              <p className="mt-1.5 text-[12px] text-white/70">
                {nextThreshold
                  ? t('progress_to_next', { count: orderCount, target: nextThreshold, next: t(`tier_${nextTierKey}`) })
                  : t('max_level')}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-5xl md:text-6xl">☕</div>
        </div>
      </div>

      {/* 2. Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <Icon size={22} className="shrink-0 text-[#3A2115]" />
            <span className="font-medium text-[#3A2115]">{label}</span>
          </Link>
        ))}
      </div>

      {/* 3. Recent orders */}
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

      {/* 4. Profile data */}
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
