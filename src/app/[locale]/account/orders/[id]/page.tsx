'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { fmtPrice } from '@/lib/pricing'
import { useAuth } from '@/hooks/useAuth'

interface OrderItem {
  id: string
  product_name: string
  weight: number
  quantity: number
  unit_price: number
  line_total: number
}

interface OrderDetail {
  id: string
  order_number: number
  status: string
  payment_status: string
  created_at: string
  delivery_type: string
  tracking_number: string | null
  delivery_address: any
  subtotal: number
  discount_pct: number
  discount_amount: number
  delivery_cost: number
  total: number
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_telegram: string | null
  payment_provider: string | null
  shop_order_items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export default function OrderDetailPage() {
  const params = useParams()
  const locale = params.locale as string
  const orderId = params.id as string
  const t = useTranslations('account')
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoadingOrder(true)
    fetch(`/api/account/orders/${orderId}`)
      .then(res => res.json())
      .then(data => setOrder(data.order ?? null))
      .finally(() => setLoadingOrder(false))
  }, [orderId, user])

  if (loading) return <div className="text-center text-brand-muted">Загрузка…</div>
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('order_detail_title')}</h1>
          <p className="text-sm text-brand-muted">#{order?.order_number ?? '—'}</p>
        </div>
        <Link href={`/${locale}/account/orders`} className="btn btn-outline text-sm">
          {t('back_to_orders')}
        </Link>
      </div>

      {loadingOrder ? (
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-8 text-center text-brand-muted">{t('loading')}</div>
      ) : !order ? (
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-8 text-center text-brand-muted">{t('order_not_found')}</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-brand-muted">{STATUS_LABELS[order.status] ?? order.status}</p>
                <p className="text-xs text-brand-muted">{t('payment_status')}: {order.payment_status}</p>
              </div>
              {order.tracking_number && (
                <a
                  href={`https://inpost.pl/pl/sledowanie?numer=${encodeURIComponent(order.tracking_number)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand-accent underline"
                >
                  {t('track_parcel')}
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
            <h2 className="text-lg font-semibold mb-4">{t('order_items')}</h2>
            <div className="space-y-4">
              {order.shop_order_items.map(item => (
                <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-brand-muted">{item.weight}g × {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{fmtPrice(item.line_total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-brand-surface p-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="font-semibold mb-2">{t('delivery_address')}</h2>
              <div className="text-sm text-brand-muted space-y-1">
                {order.delivery_type === 'paczkomat' ? (
                  <>
                    <p>{order.delivery_address.paczkomat_name}</p>
                    <p>{order.delivery_address.paczkomat_address}</p>
                  </>
                ) : (
                  <>
                    <p>{order.delivery_address.street}</p>
                    <p>{order.delivery_address.city}, {order.delivery_address.postal_code}</p>
                    <p>{order.delivery_address.country}</p>
                  </>
                )}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2">{t('payment')}</h2>
              <div className="text-sm text-brand-muted space-y-1">
                <p>{t('payment_provider')}: {order.payment_provider ?? '—'}</p>
                <p>{t('customer_phone')}: {order.customer_phone ?? '—'}</p>
                <p>{t('customer_telegram')}: {order.customer_telegram || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
            <div className="space-y-2 text-sm text-brand-muted">
              <div className="flex justify-between"><span>{t('subtotal')}</span><span>{fmtPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>{t('discount')}</span><span>{order.discount_pct}%</span></div>
              <div className="flex justify-between"><span>{t('delivery_cost')}</span><span>{fmtPrice(order.delivery_cost)}</span></div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-4 text-base font-semibold">
              <span>{t('total')}</span>
              <span>{fmtPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
