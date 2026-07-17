'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { fmtPrice } from '@/lib/pricing'
import BuyAgainButton from '@/components/account/BuyAgainButton'
import type { Locale } from '@/types/shop'

const CRM_URL = process.env.NEXT_PUBLIC_CRM_URL ?? 'https://coffe-verve-crm.vercel.app'
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

export interface OrderItemView {
  product_name:    string
  product_slug:    string | null
  shop_product_id: string | null
  weight:          number
  quantity:        number
  line_total:      number
  grind:           string | null
  grind_option:    string | null
  tokens:          string[]
}

export interface OrderView {
  id:           string
  order_number: number
  total:        number
  status:       string
  created_at:   string
  items:        OrderItemView[]
}

interface Props {
  locale:        Locale
  shopUserId:    string | null
  initialOrders: OrderView[]
}

export default function RecentOrders({ locale, shopUserId, initialOrders }: Props) {
  const t = useTranslations('dashboard')
  const [orders, setOrders] = useState<OrderView[]>(initialOrders)

  // Live status: subscribe to shop_orders UPDATE for this customer + poll as a
  // fallback if the realtime channel drops (same pattern as the CRM Orders view).
  useEffect(() => {
    const ids = initialOrders.map(o => o.id)
    if (ids.length === 0 || !shopUserId) return
    const sb = createClient()

    async function refreshStatuses() {
      const { data } = await sb.from('shop_orders').select('id, status').in('id', ids)
      if (!data) return
      setOrders(prev => prev.map(o => {
        const found = data.find(d => d.id === o.id)
        return found && found.status !== o.status ? { ...o, status: found.status } : o
      }))
    }

    // Filter by shop_user_id so the Realtime subscription matches the RLS SELECT
    // policy (orders visible via shop_users.auth_user_id = auth.uid()). Filtering
    // by customer_email would not line up with RLS and could silently deliver
    // nothing.
    const channel = sb
      .channel('account-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shop_orders', filter: `shop_user_id=eq.${shopUserId}` },
        payload => {
          const row = payload.new as { id: string; status: string }
          setOrders(prev => prev.map(o => (o.id === row.id ? { ...o, status: row.status } : o)))
        },
      )
      .subscribe()

    const interval = setInterval(refreshStatuses, 25000)

    return () => {
      sb.removeChannel(channel)
      clearInterval(interval)
    }
  }, [shopUserId, initialOrders])

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <h2 className="mb-4 text-[18px] font-bold uppercase text-[#3A2115]">{t('recent_orders_title')}</h2>

      {orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-brand-muted">{t('no_orders')}</p>
          <Link href={`/${locale}`} className="btn btn-primary">{t('go_to_catalog')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
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
                {order.items.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {order.items.flatMap((item, i) => {
                      const perPack = fmtPrice(item.line_total / item.quantity)
                      const grindText =
                        item.grind === 'whole'
                          ? t('grind_whole')
                          : item.grind === 'ground'
                            ? (item.grind_option && GRIND_OPTS.includes(item.grind_option)
                                ? `${t('grind_ground')} (${t(`grind_opt_${item.grind_option}`)})`
                                : t('grind_ground'))
                            : ''
                      return Array.from({ length: item.quantity }).map((_, u) => {
                        const token = item.tokens[u]
                        return (
                          <li key={`${i}-${u}`} className="flex items-center justify-between gap-2 leading-tight">
                            <span className="min-w-0 truncate">
                              <span className="text-[13px] font-medium text-[#3A2115]">{item.product_name}</span>
                              <span className="text-xs text-gray-500"> · {item.weight}г — {perPack}{grindText ? ` · ${grindText}` : ''}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              <BuyAgainButton
                                locale={locale}
                                shopProductId={item.shop_product_id}
                                slug={item.product_slug}
                                weight={item.weight}
                                grind={item.grind}
                                grindOption={item.grind_option}
                              />
                              {token ? (
                                delivered ? (
                                  <a
                                    href={`${CRM_URL}/passport/${token}?lang=${locale}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="whitespace-nowrap rounded-full border border-[#412618] px-2 py-0.5 text-[11px] font-medium text-[#412618]"
                                  >
                                    {t('report_problem')}
                                  </a>
                                ) : (
                                  <span
                                    aria-disabled="true"
                                    title={t('report_after_delivery')}
                                    className="cursor-not-allowed whitespace-nowrap rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-300"
                                  >
                                    {t('report_problem')}
                                  </span>
                                )
                              ) : (
                                <span aria-hidden="true" className="invisible whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium">
                                  {t('report_problem')}
                                </span>
                              )}
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
  )
}
