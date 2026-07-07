'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { fmtPrice } from '@/lib/pricing'
import { useAuth } from '@/hooks/useAuth'

interface Order {
  id: string
  order_number: number
  total: number
  status: string
  created_at: string
  tracking_number: string | null
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Ожидает оплаты', className: 'bg-gray-100 text-gray-700' },
  paid:       { label: 'Оплачен', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'В обработке', className: 'bg-amber-100 text-amber-700' },
  shipped:    { label: 'Отправлен', className: 'bg-orange-100 text-orange-700' },
  delivered:  { label: 'Доставлен', className: 'bg-emerald-100 text-emerald-700' },
  cancelled:  { label: 'Отменён', className: 'bg-red-100 text-red-700' },
}

export default function OrdersPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('account')
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoadingOrders(true)
    fetch('/api/account/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders ?? []))
      .finally(() => setLoadingOrders(false))
  }, [user])

  if (loading) return <div className="text-center text-brand-muted">Загрузка…</div>
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('orders_title')}</h1>
          <p className="text-sm text-brand-muted">{t('orders_subtitle')}</p>
        </div>
        <Link href={`/${locale}/account`} className="btn btn-outline text-sm">
          {t('back_to_account')}
        </Link>
      </div>

      <div className="rounded-3xl border border-brand-border bg-brand-surface overflow-hidden">
        {loadingOrders ? (
          <div className="p-8 text-center text-brand-muted">{t('loading')}</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-brand-muted">{t('orders_empty')}</div>
        ) : (
          <div className="divide-y divide-brand-border">
            {orders.map(order => {
              const status = STATUS_MAP[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-700' }
              return (
                <div key={order.id} className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">Заказ #{order.order_number}</p>
                    <p className="text-sm text-brand-muted mt-1">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    <p className="font-semibold">{fmtPrice(order.total)}</p>
                    <Link href={`/${locale}/account/orders/${order.id}`} className="btn btn-outline btn-sm">
                      {t('details')}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
