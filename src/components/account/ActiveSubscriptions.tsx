'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

interface SubItem { name: string; weight: number; grind: string; quantity: number }
export interface DashSub {
  id:                 string
  status:             'active' | 'paused' | 'cancelled'
  items:              SubItem[]
  interval_weeks:     number
  next_delivery_date: string
}
export interface CancelledSub {
  id:             string
  items:          SubItem[]
  interval_weeks: number
  cancelled_at:   string | null
}

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }

function nextDateFrom(intervalWeeks: number): string {
  const d = new Date()
  d.setDate(d.getDate() + intervalWeeks * 7)
  return d.toISOString().slice(0, 10)
}

export default function ActiveSubscriptions({
  locale, initialSubs, cancelledSubs,
}: {
  locale: Locale
  initialSubs: DashSub[]
  cancelledSubs: CancelledSub[]
}) {
  const t  = useTranslations('account')
  const td = useTranslations('dashboard')
  const tp = useTranslations('product')
  const [subs, setSubs] = useState<DashSub[]>(initialSubs)
  const [cancelled, setCancelled] = useState<CancelledSub[]>(cancelledSubs)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<DashSub | null>(null)
  const [showCancelled, setShowCancelled] = useState(false)
  const [confirmResume, setConfirmResume] = useState<CancelledSub | null>(null)
  const [resumed, setResumed] = useState<string | null>(null)

  const grindLabel = (g: string) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE[locale])

  async function setStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
    if (status === 'cancelled' && !window.confirm(t('subs_cancel_confirm'))) return
    setBusy(id)
    const sb = createClient()
    const fields: Record<string, unknown> = { status }
    if (status === 'paused')    fields.paused_at    = new Date().toISOString()
    if (status === 'active')    fields.paused_at    = null
    if (status === 'cancelled') fields.cancelled_at = new Date().toISOString()
    await sb.from('subscriptions').update(fields).eq('id', id)
    setBusy(null)
    if (status === 'cancelled') {
      const moved = subs.find(s => s.id === id)
      setSubs(prev => prev.filter(s => s.id !== id))
      if (moved) setCancelled(prev => [{ id: moved.id, items: moved.items, interval_weeks: moved.interval_weeks, cancelled_at: new Date().toISOString() }, ...prev])
    } else {
      setSubs(prev => prev.map(s => (s.id === id ? { ...s, status } : s)))
    }
  }

  async function saveEdit(id: string, intervalWeeks: number, nextDate: string) {
    setBusy(id)
    const sb = createClient()
    await sb.from('subscriptions').update({ interval_weeks: intervalWeeks, next_delivery_date: nextDate }).eq('id', id)
    setBusy(null)
    setSubs(prev => prev.map(s => (s.id === id ? { ...s, interval_weeks: intervalWeeks, next_delivery_date: nextDate } : s)))
    setEditing(null)
  }

  async function resume(sub: CancelledSub) {
    setBusy(sub.id)
    const nextDate = nextDateFrom(sub.interval_weeks)
    const sb = createClient()
    await sb.from('subscriptions').update({ status: 'active', cancelled_at: null, next_delivery_date: nextDate }).eq('id', sub.id)
    setBusy(null)
    setConfirmResume(null)
    setCancelled(prev => prev.filter(c => c.id !== sub.id))
    setSubs(prev => [...prev, { id: sub.id, status: 'active', items: sub.items, interval_weeks: sub.interval_weeks, next_delivery_date: nextDate }])
    setResumed(fmtDate(nextDate))
  }

  return (
    <section className="flex flex-1 flex-col">
      {subs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-md">
          <p className="text-gray-500">{t('subs_empty')}</p>
          <Link href={`/${locale}/shop/subskrypcja`} className="mt-4 inline-block rounded-full bg-[#412618] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]">{t('subs_empty_cta')}</Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {subs.map(s => (
            <div key={s.id} className="flex flex-1 flex-col rounded-2xl border border-gray-200 border-t-2 border-t-[#412618] bg-white p-6 shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                {s.status === 'active' ? (
                  <span className="rounded-full border border-[#412618] px-3 py-1 text-xs font-semibold text-[#412618]">{t('subs_status_active')}</span>
                ) : (
                  <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">{t('subs_status_paused')}</span>
                )}
                <span className="text-xs text-gray-400">{t('subs_every', { n: s.interval_weeks })}</span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-[#3A2115]">
                {(s.items ?? []).map((it, i) => (
                  <li key={i} className="truncate">
                    {it.name} · {wLabel(it.weight)} · {grindLabel(it.grind)}{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''}
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">{t('subs_next')}</p>
                <p className="text-xl font-bold text-[#412618]">{fmtDate(s.next_delivery_date)}</p>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <button type="button" disabled={busy === s.id} onClick={() => setEditing(s)}
                  className="rounded-full bg-[#412618] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-50">
                  {t('subs_edit')}
                </button>
                {s.status === 'active' ? (
                  <button type="button" disabled={busy === s.id} onClick={() => setStatus(s.id, 'paused')}
                    className="rounded-full border border-[#412618] px-4 py-1.5 text-xs font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 disabled:opacity-50">
                    {t('subs_pause')}
                  </button>
                ) : (
                  <button type="button" disabled={busy === s.id} onClick={() => setStatus(s.id, 'active')}
                    className="rounded-full border border-[#412618] px-4 py-1.5 text-xs font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 disabled:opacity-50">
                    {t('subs_resume')}
                  </button>
                )}
                <button type="button" disabled={busy === s.id} onClick={() => setStatus(s.id, 'cancelled')}
                  className="px-2 py-1.5 text-xs font-semibold text-[#412618] transition-colors hover:underline disabled:opacity-50">
                  {t('subs_cancel')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancelled subscriptions — collapsed */}
      {cancelled.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowCancelled(v => !v)} className="text-sm font-medium text-[#412618] hover:underline">
            {t('subs_show_cancelled', { n: cancelled.length })} {showCancelled ? '▴' : '▾'}
          </button>
          {showCancelled && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {cancelled.map(s => (
                <div key={s.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 opacity-70 transition-opacity hover:opacity-100">
                  <span className="self-start rounded-full border border-gray-300 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                    {t('archive_cancelled_on', { date: s.cancelled_at ? fmtDate(s.cancelled_at) : '—' })}
                  </span>
                  <ul className="mt-2 space-y-0.5 text-sm text-[#3A2115]">
                    {(s.items ?? []).map((it, i) => (
                      <li key={i} className="truncate">{it.name} · {wLabel(it.weight)}{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''}</li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setConfirmResume(s)}
                    className="mt-3 self-start rounded-full border border-[#412618] px-4 py-1.5 text-xs font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5">
                    {t('archive_resume')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal sub={editing} busy={busy === editing.id} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}

      {confirmResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setConfirmResume(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] text-[#3A2115]">{t('archive_resume_confirm', { date: fmtDate(nextDateFrom(confirmResume.interval_weeks)) })}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmResume(null)} className="btn btn-outline text-sm">{t('subs_cancel_edit')}</button>
              <button type="button" disabled={busy === confirmResume.id} onClick={() => resume(confirmResume)} className="btn btn-primary text-sm disabled:opacity-60">{t('archive_resume')}</button>
            </div>
          </div>
        </div>
      )}

      {resumed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResumed(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold text-[#412618]">{t('archive_resumed_title')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('archive_resumed_body', { date: resumed })}</p>
            <button type="button" onClick={() => setResumed(null)} className="mt-6 rounded-full bg-[#412618] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]">{td('reviews_close')}</button>
          </div>
        </div>
      )}
    </section>
  )
}

function EditModal({
  sub, busy, onClose, onSave,
}: {
  sub: DashSub
  busy: boolean
  onClose: () => void
  onSave: (id: string, intervalWeeks: number, nextDate: string) => void
}) {
  const t = useTranslations('account')
  const [weeks, setWeeks] = useState(sub.interval_weeks)
  const [date, setDate]   = useState(sub.next_delivery_date.slice(0, 10))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#3A2115]">{t('subs_edit')}</h3>

        <label className="mt-4 block text-sm text-brand-muted">{t('subs_interval')}</label>
        <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="input mt-1 text-sm">
          {[1, 2, 3, 4, 6, 8].map(w => <option key={w} value={w}>{t('subs_every', { n: w })}</option>)}
        </select>

        <label className="mt-4 block text-sm text-brand-muted">{t('subs_next')}</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input mt-1 text-sm" />

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline text-sm">{t('subs_cancel_edit')}</button>
          <button type="button" disabled={busy} onClick={() => onSave(sub.id, weeks, date)} className="btn btn-primary text-sm disabled:opacity-60">
            {t('subs_save')}
          </button>
        </div>
      </div>
    </div>
  )
}
