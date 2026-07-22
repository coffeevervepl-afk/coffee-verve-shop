'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { fmtPrice } from '@/lib/pricing'

interface SubItem { name: string; weight: number; grind: string; quantity: number; price: number }
interface Sub {
  id: string
  status: 'active' | 'paused' | 'cancelled'
  items: SubItem[]
  interval_weeks: number
  next_delivery_date: string
  discount_percent: number
  payment_method: string
  delivery_method: string | null
  delivery_address: Record<string, string> | null
}
interface Delivery {
  id: string
  scheduled_date: string
  amount: number | null
  status: string
  tracking_number: string | null
  order_id: string | null
}

const SUB_STATUS: Record<string, { key: string; cls: string }> = {
  active:    { key: 'subs_status_active',    cls: 'bg-[#412618] text-white' },
  paused:    { key: 'subs_status_paused',    cls: 'border border-[#412618] text-[#412618]' },
  cancelled: { key: 'subs_status_cancelled', cls: 'bg-gray-100 text-gray-500' },
}
const DSTATUS: Record<string, { key: string; cls: string }> = {
  pending:        { key: 'sd_pending',        cls: 'bg-gray-100 text-gray-600' },
  processing:     { key: 'sd_processing',     cls: 'bg-[#EFE7DF] text-[#7A5A3A]' },
  shipped:        { key: 'sd_shipped',        cls: 'bg-[#412618] text-white' },
  delivered:      { key: 'sd_delivered',      cls: 'bg-[#E7E2DA] text-[#3A2115]' },
  cancelled:      { key: 'sd_cancelled',      cls: 'bg-gray-100 text-gray-500' },
  payment_failed: { key: 'sd_payment_failed', cls: 'bg-gray-100 text-gray-500' },
}

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)
const DELIVERY_COST: Record<string, number> = { paczkomat: 14.99, courier: 19.99, pickup: 0 }

export default function SubscriptionDetailPage() {
  const params = useParams()
  const locale = params.locale as string
  const id     = params.id as string
  const t  = useTranslations('account')
  const tp = useTranslations('product')
  const { user, loading } = useAuth()

  const [sub, setSub] = useState<Sub | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('id', id).maybeSingle(),
      supabase.from('subscription_deliveries').select('*').eq('subscription_id', id).order('scheduled_date', { ascending: false }),
    ])
    setSub((s as Sub) ?? null)
    setDeliveries((d as Delivery[]) ?? [])
    setLoadingData(false)
  }, [id])

  useEffect(() => { if (user) load() }, [user, load])

  if (loading || loadingData) return <div className="text-center text-brand-muted">{t('loading')}</div>
  if (!user) return null
  if (!sub) return <div className="text-center text-brand-muted">{t('subs_empty')}</div>

  const grindLabel = (g: string) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))

  // Totals (item.price stored in grosze).
  const subtotal    = (sub.items ?? []).reduce((s, it) => s + (Number(it.price) || 0) * (it.quantity || 1), 0) / 100
  const totalGrams  = (sub.items ?? []).reduce((s, it) => s + it.weight * (it.quantity || 1), 0)
  const cardPct     = Number(user.discount_pct ?? 0)
  const subDisc     = subtotal * sub.discount_percent / 100
  const cardDisc    = subtotal * cardPct / 100
  const freeShip    = totalGrams >= 1000
  const deliveryCost = freeShip ? 0 : (DELIVERY_COST[sub.delivery_method ?? 'paczkomat'] ?? 0)
  const total       = subtotal - subDisc - cardDisc + deliveryCost

  const addr = sub.delivery_address ?? {}
  const deliveryText = sub.delivery_method === 'paczkomat'
    ? `Paczkomat ${addr.code ?? ''}${addr.name ? ` — ${addr.name}` : ''}`
    : sub.delivery_method === 'courier'
      ? [addr.street, addr.postal_code, addr.city].filter(Boolean).join(', ')
      : (addr.location ?? '—')

  const st = SUB_STATUS[sub.status] ?? SUB_STATUS.cancelled

  async function setStatus(status: 'active' | 'paused' | 'cancelled') {
    if (status === 'cancelled' && !window.confirm(t('subs_cancel_confirm'))) return
    setBusy(true)
    const supabase = createClient()
    const fields: Record<string, unknown> = { status }
    if (status === 'paused') fields.paused_at = new Date().toISOString()
    if (status === 'active') fields.paused_at = null
    if (status === 'cancelled') fields.cancelled_at = new Date().toISOString()
    await supabase.from('subscriptions').update(fields).eq('id', sub!.id)
    setBusy(false)
    setSub(prev => prev ? { ...prev, status } : prev)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#3A2115]">{t('subs_title')}</h1>
        <Link href={`/${locale}/account/subscriptions`} className="btn btn-outline text-sm">{t('back_to_account')}</Link>
      </div>

      {/* Section 1 — composition + totals */}
      <div className="rounded-3xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[#3A2115]">{t('subs_composition')}</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{t(st.key)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-brand-muted">
              <th className="pb-2">{t('subs_col_name')}</th><th className="pb-2">{t('subs_col_weight')}</th>
              <th className="pb-2">{t('subs_col_grind')}</th><th className="pb-2">{t('subs_col_qty')}</th>
              <th className="pb-2 text-right">{t('subs_col_price')}</th>
            </tr></thead>
            <tbody>
              {(sub.items ?? []).map((it, i) => (
                <tr key={i} className="border-t border-brand-border">
                  <td className="py-2 font-medium text-[#3A2115]">{it.name}</td>
                  <td className="py-2">{wLabel(it.weight)}</td>
                  <td className="py-2">{grindLabel(it.grind)}</td>
                  <td className="py-2">{it.quantity || 1}</td>
                  <td className="py-2 text-right">{fmtPrice((Number(it.price) || 0) * (it.quantity || 1) / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-brand-border pt-3 text-sm">
          <div className="flex justify-between text-brand-muted"><span>{t('sum_base')}</span><span>{fmtPrice(subtotal)}</span></div>
          <div className="flex justify-between text-[#3A2115]"><span>{t('sum_sub', { pct: sub.discount_percent })}</span><span>−{fmtPrice(subDisc)}</span></div>
          {cardPct > 0 && <div className="flex justify-between text-[#3A2115]"><span>{t('sum_card', { pct: cardPct })}</span><span>−{fmtPrice(cardDisc)}</span></div>}
          <div className="flex justify-between text-[#3A2115]"><span>{t('sum_delivery')}</span><span>{freeShip ? t('sum_free') : fmtPrice(deliveryCost)}</span></div>
          <div className="flex justify-between border-t border-brand-border pt-2 text-base font-bold text-[#3A2115]"><span>{t('sum_total')}</span><span>{fmtPrice(total)}</span></div>
        </div>
      </div>

      {/* Section 2 — params */}
      <div className="rounded-3xl border border-brand-border bg-brand-surface p-5">
        <h2 className="mb-3 font-semibold text-[#3A2115]">{t('subs_params')}</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:block"><dt className="text-brand-muted">{t('subs_interval')}</dt><dd className="font-medium text-[#3A2115]">{t('subs_every', { n: sub.interval_weeks })}</dd></div>
          <div className="flex justify-between sm:block"><dt className="text-brand-muted">{t('subs_next')}</dt><dd className="font-medium text-[#3A2115]">{new Date(sub.next_delivery_date).toLocaleDateString('ru-RU')}</dd></div>
          <div className="flex justify-between sm:block"><dt className="text-brand-muted">{t('subs_delivery')}</dt><dd className="font-medium text-[#3A2115]">{deliveryText}</dd></div>
          <div className="flex justify-between sm:block"><dt className="text-brand-muted">{t('subs_payment')}</dt><dd className="font-medium text-[#3A2115]">{t('subs_pay_manual')}</dd></div>
        </dl>
      </div>

      {/* Section 3 — deliveries history */}
      <div className="rounded-3xl border border-brand-border bg-brand-surface p-5">
        <h2 className="mb-3 font-semibold text-[#3A2115]">{t('subs_history')}</h2>
        {deliveries.length === 0 ? (
          <p className="text-sm text-brand-muted">{t('subs_no_deliveries')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-brand-muted">
                <th className="pb-2">{t('subs_dcol_date')}</th><th className="pb-2">{t('subs_dcol_amount')}</th>
                <th className="pb-2">{t('subs_dcol_status')}</th><th className="pb-2">{t('subs_dcol_track')}</th>
                <th className="pb-2">{t('subs_dcol_order')}</th>
              </tr></thead>
              <tbody>
                {deliveries.map(d => {
                  const ds = DSTATUS[d.status] ?? DSTATUS.pending
                  return (
                    <tr key={d.id} className="border-t border-brand-border">
                      <td className="py-2">{new Date(d.scheduled_date).toLocaleDateString('ru-RU')}</td>
                      <td className="py-2">{d.amount != null ? fmtPrice(d.amount / 100) : '—'}</td>
                      <td className="py-2"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ds.cls}`}>{t(ds.key)}</span></td>
                      <td className="py-2">
                        {d.tracking_number
                          ? (sub!.delivery_method === 'paczkomat'
                              ? <a href={`https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(d.tracking_number)}`} target="_blank" rel="noopener noreferrer" className="text-[#412618] underline">{d.tracking_number}</a>
                              : <span>{d.tracking_number}</span>)
                          : '—'}
                      </td>
                      <td className="py-2">{d.order_id ? d.order_id.slice(0, 8) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4 — actions */}
      {sub.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-3">
          {sub.status === 'active' && <button type="button" disabled={busy} onClick={() => setStatus('paused')} className="btn btn-outline text-sm">{t('subs_pause')}</button>}
          {sub.status === 'paused' && <button type="button" disabled={busy} onClick={() => setStatus('active')} className="btn btn-primary text-sm">{t('subs_resume')}</button>}
          <button type="button" disabled={busy} onClick={() => setStatus('cancelled')} className="btn btn-outline text-sm">{t('subs_cancel')}</button>
        </div>
      )}
    </div>
  )
}
