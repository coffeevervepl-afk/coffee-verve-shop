'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductName, getProductImage, getProductPrice } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import ReviewModal, { type ReviewTarget } from '@/components/account/ReviewModal'
import type { Locale, ShopProduct } from '@/types/shop'

const GRIND_SURCHARGE = 3
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }

const STATUS_STYLES: Record<string, string> = {
  new:        'border border-gray-300 text-gray-500',
  confirmed:  'border border-gray-300 text-gray-500',
  processing: 'border border-[#412618] text-[#412618]',
  shipped:    'border border-[#412618] text-[#412618]',
  delivered:  'border border-[#412618] text-[#412618]',
  cancelled:  'border border-gray-300 text-gray-400',
}

export interface OrderItem {
  product_name:    string
  product_slug:    string | null
  shop_product_id: string | null
  weight:          number
  quantity:        number
  line_total:      number
  grind:           string | null
  grind_option:    string | null
}
export interface OrderRow {
  id:               string
  order_number:     number
  total:            number
  status:           string
  created_at:       string
  source:           string | null
  delivery_type:    string | null
  delivery_address: Record<string, string> | null
  tracking_number:  string | null
  items:            OrderItem[]
}

interface Props {
  locale:             Locale
  orders:             OrderRow[]
  totalCount:         number
  reviewedProductIds: string[]
  authorName:         string
  email:              string
}

export default function OrdersAccordion({ locale, orders, totalCount, reviewedProductIds, authorName, email }: Props) {
  const t   = useTranslations('dashboard')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showAll, setShowAll]   = useState(false)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set(reviewedProductIds))
  const [review, setReview]     = useState<ReviewTarget | null>(null)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric' })

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function deliveryText(o: OrderRow): string {
    const a = o.delivery_address ?? {}
    if (o.delivery_type === 'paczkomat') {
      const code = a.paczkomat_id || a.code || a.paczkomat_name || ''
      return code ? `Paczkomat ${code}` : 'Paczkomat'
    }
    if (o.delivery_type === 'courier') {
      return [a.street, a.postal_code, a.city].filter(Boolean).join(', ') || t('orders_pickup')
    }
    return a.location || t('orders_pickup')
  }

  async function repeat(o: OrderRow) {
    setBusyOrder(o.id)
    const sb = createClient()
    let unavailable = 0
    let added = 0
    for (const it of o.items) {
      try {
        let q = sb.from('shop_products').select('*').eq('is_active', true)
        if (it.shop_product_id) q = q.eq('id', it.shop_product_id)
        else if (it.product_slug) q = q.eq('slug', it.product_slug)
        else { unavailable++; continue }
        const { data } = await q.limit(1).maybeSingle()
        if (!data) { unavailable++; continue }
        const product = data as ShopProduct
        const w = it.weight as 250 | 500 | 1000
        const isGround = it.grind === 'ground'
        add({
          product_id:  product.id,
          slug:        product.slug,
          name:        getProductName(product, locale),
          image:       getProductImage(product),
          weight:      w,
          grind:       isGround ? 'ground' : 'whole',
          grindOption: isGround ? (it.grind_option ?? undefined) : undefined,
          unit_price:  getProductPrice(product, w) + (isGround ? GRIND_SURCHARGE : 0),
          qty:         it.quantity || 1,
        })
        added++
      } catch { unavailable++ }
    }
    setBusyOrder(null)
    if (added === 0) { toast.error(t('reorder_unavailable')); return }
    if (unavailable > 0) toast.error(t('orders_some_unavailable'))
    else toast.success(t('added_to_cart'))
    open()
  }

  function onReviewSubmitted(productId: string) {
    setReviewed(prev => new Set(prev).add(productId))
    setReview(null)
    toast.success(t('reviews_thanks_title'))
  }

  // Empty state.
  if (orders.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 border-t-2 border-t-[#412618] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[18px] font-bold uppercase text-[#3A2115]">{t('recent_orders_title')}</h2>
        <div className="py-8 text-center">
          <p className="mb-4 text-gray-500">{t('no_orders')}</p>
          <Link href={`/${locale}/shop`} className="inline-block rounded-full bg-[#412618] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]">{t('go_to_catalog')}</Link>
        </div>
      </section>
    )
  }

  const visible = showAll ? orders : orders.slice(0, 5)

  return (
    <section className="rounded-2xl border border-gray-200 border-t-2 border-t-[#412618] bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-2 text-[18px] font-bold uppercase text-[#3A2115]">{t('recent_orders_title')}</h2>

      <div>
        {visible.map(o => {
          const isOpen = expanded.has(o.id)
          const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.new
          const delivered = o.status === 'delivered'
          // Unique un-reviewed products in this order (only offered once delivered).
          const seen = new Set<string>()
          const reviewable = delivered
            ? o.items.filter(it => {
                const pid = it.shop_product_id
                if (!pid || reviewed.has(pid) || seen.has(pid)) return false
                seen.add(pid); return true
              })
            : []
          const trackUrl = o.tracking_number && o.delivery_type === 'paczkomat'
            ? `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(o.tracking_number)}`
            : null

          return (
            <div key={o.id} className="border-b border-gray-100 last:border-0">
              <button type="button" onClick={() => toggle(o.id)}
                className="flex w-full items-center gap-2 py-3.5 text-left transition-colors hover:bg-gray-50/70">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-xs text-gray-400">#{o.order_number}</span>
                  {o.source === 'subscription' && (
                    <span className="rounded border border-[#412618]/40 px-1.5 py-px text-[10px] font-semibold text-[#412618]">{t('orders_sub_badge')}</span>
                  )}
                  <span className="text-xs text-gray-400">· {fmtDate(o.created_at)}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-[#412618]">{fmtPrice(o.total)}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st}`}>{t(`status_${o.status}`)}</span>
                <span aria-hidden className="shrink-0 text-gray-400">{isOpen ? '▴' : '▾'}</span>
              </button>

              {isOpen && (
                <div className="px-1 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('orders_composition')}</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-[#3A2115]">
                      {o.items.map((it, i) => (
                        <li key={i}>• {it.product_name} {it.weight}г{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''} — {fmtPrice(it.line_total)}</li>
                      ))}
                    </ul>

                    <div className="mt-3 space-y-0.5 text-sm">
                      <p className="text-gray-500">{t('orders_delivery')}: <span className="text-[#3A2115]">{deliveryText(o)}</span></p>
                      {o.tracking_number && (
                        <p className="text-gray-500">
                          {t('orders_tracking')}: <span className="text-[#3A2115]">{o.tracking_number}</span>
                          {trackUrl && <> · <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#412618] hover:underline">{t('orders_track_link')}</a></>}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {reviewable.map(it => (
                        <button key={it.shop_product_id} type="button"
                          onClick={() => setReview({ productId: it.shop_product_id as string, orderId: o.id, name: it.product_name })}
                          className="w-full rounded-full border border-[#412618] px-4 py-2 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 sm:w-auto">
                          {t('orders_write_review', { name: it.product_name })}
                        </button>
                      ))}
                      <button type="button" disabled={busyOrder === o.id} onClick={() => repeat(o)}
                        className="w-full rounded-full bg-[#412618] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-50 sm:w-auto">
                        {busyOrder === o.id ? '…' : t('orders_repeat')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalCount > 5 && (
        <button type="button" onClick={() => setShowAll(v => !v)}
          className="mt-3 block w-full text-center text-sm font-medium text-[#412618] hover:underline">
          {showAll ? t('orders_show_less') : t('see_all_orders', { n: totalCount })}
        </button>
      )}

      {review && (
        <ReviewModal
          target={review}
          authorName={authorName}
          email={email}
          onClose={() => setReview(null)}
          onSubmitted={onReviewSubmitted}
        />
      )}
    </section>
  )
}
