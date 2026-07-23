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
  paused_at:          string | null
  paused_until:       string | null
}
export interface LastCancelled {
  id:               string
  items:            SubItem[]
  interval_weeks:   number
  delivery_method:  string | null
  delivery_address: Record<string, unknown> | null
}

type ReasonCode = 'too_much_coffee' | 'try_others' | 'too_expensive' | 'delivery_issue' | 'forgot_pickup' | 'quality_issue' | 'no_time' | 'other'
const REASONS: ReasonCode[] = ['too_much_coffee', 'try_others', 'too_expensive', 'delivery_issue', 'forgot_pickup', 'quality_issue', 'no_time', 'other']

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }
const SHIMMER_BTN = 'brand-shimmer self-start rounded-full px-6 py-3 text-sm font-medium text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50'

function ymdPlusWeeks(weeks: number): string {
  const d = new Date(); d.setDate(d.getDate() + weeks * 7); return d.toISOString().slice(0, 10)
}
function ymdPlusMonths(n: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10)
}

interface Props {
  locale:        Locale
  initialSubs:   DashSub[]
  lastCancelled: LastCancelled | null
  authUserId:    string
}

export default function ActiveSubscriptions({ locale, initialSubs, lastCancelled, authUserId }: Props) {
  const t  = useTranslations('account')
  const tp = useTranslations('product')
  const [subs, setSubs]         = useState<DashSub[]>(initialSubs)
  const [busy, setBusy]         = useState<string | null>(null)
  const [editing, setEditing]   = useState<DashSub | null>(null)
  const [pausing, setPausing]   = useState<DashSub | null>(null)
  const [canceling, setCanceling] = useState<DashSub | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoredDate, setRestoredDate] = useState<string | null>(null)

  const grindLabel = (g: string) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE[locale])

  async function doPause(sub: DashSub, pausedUntil: string | null) {
    setBusy(sub.id)
    await createClient().from('subscriptions')
      .update({ status: 'paused', paused_at: new Date().toISOString(), paused_until: pausedUntil })
      .eq('id', sub.id)
    setBusy(null); setPausing(null)
    setSubs(prev => prev.map(s => (s.id === sub.id ? { ...s, status: 'paused', paused_at: new Date().toISOString(), paused_until: pausedUntil } : s)))
  }

  async function resume(sub: DashSub) {
    setBusy(sub.id)
    const nextDate = ymdPlusWeeks(sub.interval_weeks)
    await createClient().from('subscriptions')
      .update({ status: 'active', paused_at: null, paused_until: null, next_delivery_date: nextDate })
      .eq('id', sub.id)
    setBusy(null)
    setSubs(prev => prev.map(s => (s.id === sub.id ? { ...s, status: 'active', paused_at: null, paused_until: null, next_delivery_date: nextDate } : s)))
  }

  async function saveEdit(id: string, intervalWeeks: number, nextDate: string) {
    setBusy(id)
    await createClient().from('subscriptions').update({ interval_weeks: intervalWeeks, next_delivery_date: nextDate }).eq('id', id)
    setBusy(null)
    setSubs(prev => prev.map(s => (s.id === id ? { ...s, interval_weeks: intervalWeeks, next_delivery_date: nextDate } : s)))
    setEditing(null)
  }

  async function restore() {
    if (!lastCancelled) return
    setRestoring(true)
    const weeks = lastCancelled.interval_weeks
    const nextDate = ymdPlusWeeks(weeks)
    const sb = createClient()
    const { data, error } = await sb.from('subscriptions').insert({
      user_id: authUserId, status: 'active', items: lastCancelled.items, interval_weeks: weeks,
      next_delivery_date: nextDate, discount_percent: 5, payment_method: 'manual',
      delivery_method: lastCancelled.delivery_method, delivery_address: lastCancelled.delivery_address,
    }).select('id').single()
    if (!error && data) {
      // Mark the source cancellation as "returned" for CRM analytics.
      await sb.rpc('mark_cancellation_returned', { p_subscription_id: lastCancelled.id })
    }
    setRestoring(false)
    if (error || !data) return
    setSubs(prev => [...prev, { id: data.id, status: 'active', items: lastCancelled.items, interval_weeks: weeks, next_delivery_date: nextDate, paused_at: null, paused_until: null }])
    setRestoredDate(fmtDate(nextDate))
  }

  const renderComposition = (items: SubItem[]) => (
    <ul className="mt-3 space-y-2">
      {(items ?? []).map((it, i) => (
        <li key={i} className="truncate">
          <span className="text-base font-medium text-[#412618]">{it.name}</span>
          <span className="text-sm font-normal text-gray-500">
            <span className="text-gray-400"> · </span>{wLabel(it.weight)}<span className="text-gray-400"> · </span>{grindLabel(it.grind)}{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <section className="flex flex-1 flex-col">
      {subs.length === 0 ? (
        <EmptyState locale={locale} hasCancelled={!!lastCancelled} restoring={restoring} onRestore={restore} />
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {subs.map(s => (
            <div key={s.id} className="flex flex-1 flex-col rounded-2xl border border-gray-200 border-t-2 border-t-[#412618] bg-white p-6 shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                {s.status === 'active' ? (
                  <span className="brand-shimmer rounded-full px-3 py-1 text-xs font-medium text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]">{t('subs_status_active')}</span>
                ) : (
                  <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">{t('subs_status_paused')}</span>
                )}
                <span className="text-xs text-gray-400">{t('subs_every', { n: s.interval_weeks })}</span>
              </div>

              {renderComposition(s.items)}

              {s.status === 'active' ? (
                <>
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500">{t('subs_next')}</p>
                    <p className="text-lg font-semibold text-[#412618]">{fmtDate(s.next_delivery_date)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
                    <button type="button" disabled={busy === s.id} onClick={() => setEditing(s)} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_edit')}</button>
                    <button type="button" disabled={busy === s.id} onClick={() => setPausing(s)} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_pause')}</button>
                    <button type="button" disabled={busy === s.id} onClick={() => setCanceling(s)} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_cancel')}</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-500">
                    {s.paused_until
                      ? t('subs_resume_auto', { date: fmtDate(s.paused_until) })
                      : (s.paused_at ? t('subs_paused_since', { date: fmtDate(s.paused_at) }) : '')}
                  </p>
                  <div className="mt-auto flex flex-col pt-6">
                    <button type="button" disabled={busy === s.id} onClick={() => resume(s)} className={SHIMMER_BTN}>
                      {busy === s.id ? '…' : (s.paused_until ? t('subs_resume_now') : t('subs_resume_full'))}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && <EditModal sub={editing} busy={busy === editing.id} onClose={() => setEditing(null)} onSave={saveEdit} />}

      {pausing && (
        <PauseModal
          busy={busy === pausing.id}
          onClose={() => setPausing(null)}
          onPick={(months) => doPause(pausing, months == null ? null : ymdPlusMonths(months))}
        />
      )}

      {canceling && (
        <ExitSurvey
          sub={canceling}
          onClose={() => setCanceling(null)}
          onPaused={(pausedUntil) => {
            setSubs(prev => prev.map(s => (s.id === canceling.id ? { ...s, status: 'paused', paused_at: new Date().toISOString(), paused_until: pausedUntil } : s)))
            setCanceling(null)
          }}
          onCancelled={() => {
            setSubs(prev => prev.filter(s => s.id !== canceling.id))
            setCanceling(null)
          }}
        />
      )}

      {restoredDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRestoredDate(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold text-[#412618]">{t('restore_title')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('restore_body', { date: restoredDate })}</p>
            <button type="button" onClick={() => setRestoredDate(null)} className="mt-6 rounded-full bg-[#412618] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]">OK</button>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Pause duration modal ─────────────────────────────────────────────────────
function PauseModal({ busy, onClose, onPick }: { busy: boolean; onClose: () => void; onPick: (months: number | null) => void }) {
  const t = useTranslations('account')
  const opt = 'w-full rounded-full border border-[#412618] px-4 py-2.5 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 disabled:opacity-50'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#3A2115]">{t('pause_title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('pause_sub')}</p>
        <div className="mt-5 space-y-2">
          <button type="button" disabled={busy} onClick={() => onPick(1)} className={opt}>{t('pause_1m')}</button>
          <button type="button" disabled={busy} onClick={() => onPick(2)} className={opt}>{t('pause_2m')}</button>
          <button type="button" disabled={busy} onClick={() => onPick(3)} className={opt}>{t('pause_3m')}</button>
          <button type="button" disabled={busy} onClick={() => onPick(null)} className={opt}>{t('pause_manual')}</button>
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full text-center text-sm font-normal text-gray-500 hover:text-gray-700">{t('subs_cancel_edit')}</button>
      </div>
    </div>
  )
}

// ── Exit survey (reason → pause offer → confirm) ─────────────────────────────
function ExitSurvey({ sub, onClose, onPaused, onCancelled }: {
  sub: DashSub
  onClose: () => void
  onPaused: (pausedUntil: string) => void
  onCancelled: () => void
}) {
  const t = useTranslations('account')
  const [step, setStep] = useState<'reason' | 'offer' | 'confirm'>('reason')
  const [reason, setReason] = useState<ReasonCode | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [busy, setBusy] = useState(false)

  const offeredPause = reason !== 'no_time'

  async function log(finalAction: 'paused' | 'cancelled' | 'stayed', acceptedPause: boolean, pausedUntil: string | null) {
    setBusy(true)
    const { error } = await createClient().rpc('log_subscription_cancellation', {
      p_subscription_id: sub.id,
      p_reason_code:     reason,
      p_reason_text:     reason === 'other' ? (reasonText.trim() || null) : null,
      p_offered_pause:   offeredPause,
      p_accepted_pause:  acceptedPause,
      p_final_action:    finalAction,
      p_paused_until:    pausedUntil,
    })
    setBusy(false)
    return !error
  }

  async function acceptPause(months: number) {
    const pausedUntil = ymdPlusMonths(months)
    if (await log('paused', true, pausedUntil)) onPaused(pausedUntil)
  }
  async function confirmCancel() {
    if (await log('cancelled', false, null)) onCancelled()
  }
  async function stay() {
    await log('stayed', false, null)
    onClose()
  }

  const outlineBtn = 'w-full rounded-full border border-[#412618] px-4 py-2.5 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 disabled:opacity-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
        {step === 'reason' && (
          <>
            <h3 className="text-lg font-semibold text-[#3A2115]">{t('exit_title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('exit_sub')}</p>
            <div className="mt-4 space-y-1.5">
              {REASONS.map(code => (
                <label key={code} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${reason === code ? 'border-[#412618] bg-[#412618]/5 text-[#3A2115]' : 'border-gray-200 text-[#3A2115] hover:bg-gray-50'}`}>
                  <input type="radio" name="reason" checked={reason === code} onChange={() => setReason(code)} className="accent-[#412618]" />
                  <span>{t(`reason_${code}`)}</span>
                </label>
              ))}
            </div>
            {reason === 'other' && (
              <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} rows={3} placeholder={t('exit_other_ph')} className="input mt-3 w-full resize-none text-sm" />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn btn-outline text-sm">{t('subs_cancel_edit')}</button>
              <button type="button" disabled={!reason} onClick={() => setStep(reason === 'no_time' ? 'confirm' : 'offer')} className="btn btn-primary text-sm disabled:opacity-50">{t('exit_continue')}</button>
            </div>
          </>
        )}

        {step === 'offer' && (
          <>
            <h3 className="text-lg font-semibold text-[#412618]">{t('pause_offer_title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('pause_offer_sub')}</p>
            <div className="mt-5 space-y-2">
              <button type="button" disabled={busy} onClick={() => acceptPause(1)} className={outlineBtn}>{t('pause_offer_1m')}</button>
              <button type="button" disabled={busy} onClick={() => acceptPause(2)} className={outlineBtn}>{t('pause_offer_2m')}</button>
              <button type="button" disabled={busy} onClick={() => acceptPause(3)} className={outlineBtn}>{t('pause_offer_3m')}</button>
            </div>
            <button type="button" disabled={busy} onClick={() => setStep('confirm')} className="mt-4 w-full text-center text-sm font-normal text-gray-500 hover:text-gray-700 disabled:opacity-50">{t('exit_still_cancel')}</button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h3 className="text-lg font-semibold text-[#3A2115]">{t('exit_confirm_title')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('exit_confirm_sub')}</p>
            <div className="mt-5 space-y-2">
              <button type="button" disabled={busy} onClick={confirmCancel} className="w-full rounded-full bg-[#412618] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-50">{t('exit_confirm_btn')}</button>
              <button type="button" disabled={busy} onClick={stay} className={outlineBtn}>{t('exit_stay_btn')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Empty state (never subscribed / all cancelled) ───────────────────────────
function EmptyState({ locale, hasCancelled, restoring, onRestore }: {
  locale: Locale
  hasCancelled: boolean
  restoring: boolean
  onRestore: () => void
}) {
  const t = useTranslations('account')
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-md">
      <span aria-hidden className="brand-shimmer absolute inset-x-0 top-0 h-0.5" />

      {!hasCancelled && <div className="text-4xl">📦</div>}
      <h3 className={`text-xl font-semibold text-[#412618] ${hasCancelled ? '' : 'mt-2'}`}>{hasCancelled ? t('empty_title_cancelled') : t('empty_title_new')}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">{hasCancelled ? t('empty_sub_cancelled') : t('empty_sub_new')}</p>

      <ul className="mx-auto mt-4 space-y-1.5 text-left text-sm text-[#5A4A3A]">
        {[t('empty_benefit_1'), t('empty_benefit_2'), t('empty_benefit_3')].map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden className="font-semibold text-[#412618]">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {hasCancelled ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" disabled={restoring} onClick={onRestore}
              className="brand-shimmer w-full rounded-full px-6 py-3 text-sm font-medium text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50 sm:w-auto">
              {restoring ? '…' : t('empty_restore')}
            </button>
            <Link href={`/${locale}/shop/subskrypcja`}
              className="w-full rounded-full border border-[#412618] px-5 py-2.5 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 sm:w-auto">
              {t('empty_new_sub')}
            </Link>
          </div>
        ) : (
          <Link href={`/${locale}/shop/subskrypcja`}
            className="inline-block w-full rounded-full bg-[#412618] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] sm:w-auto">
            {t('subs_empty_cta')}
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Edit interval / next date ────────────────────────────────────────────────
function EditModal({ sub, busy, onClose, onSave }: {
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
          <button type="button" disabled={busy} onClick={() => onSave(sub.id, weeks, date)} className="btn btn-primary text-sm disabled:opacity-60">{t('subs_save')}</button>
        </div>
      </div>
    </div>
  )
}
