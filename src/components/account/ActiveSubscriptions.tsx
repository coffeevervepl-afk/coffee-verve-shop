'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/account/Modal'
import SubscriptionEditor, { type EditorSub, type EditorSection, type EditorItem } from '@/components/account/SubscriptionEditor'
import type { Locale } from '@/types/shop'

interface SubItem { name: string; weight: number; grind: string; quantity: number; product_id?: string | null; price?: number }
export interface DashSub {
  id:                 string
  status:             'active' | 'paused' | 'cancelled'
  items:              SubItem[]
  interval_weeks:     number
  next_delivery_date: string
  paused_at:          string | null
  paused_until:       string | null
  delivery_method:    string | null
  delivery_address:   Record<string, unknown> | null
}
export interface LastCancelled {
  id:               string
  items:            SubItem[]
  interval_weeks:   number
  delivery_method:  string | null
  delivery_address: Record<string, unknown> | null
}

type ReasonCode = 'bad_taste' | 'too_often' | 'too_expensive' | 'delivery_issue' | 'found_another' | 'other'
const REASONS: ReasonCode[] = ['bad_taste', 'too_often', 'too_expensive', 'delivery_issue', 'found_another', 'other']
// Which retention offer is shown for each reason (recorded as offered_solution).
const REASON_OFFER: Record<ReasonCode, string> = {
  bad_taste: 'change_composition', too_often: 'change_interval', too_expensive: 'show_discount',
  delivery_issue: 'change_delivery', found_another: 'pause_1m', other: 'pause_1m',
}

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }
const fmtDateL = (d: string, locale: Locale) => new Date(d).toLocaleDateString(DATE_LOCALE[locale])
const SHIMMER_BTN = 'brand-shimmer self-start rounded-full px-6 py-3 text-sm font-medium text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50'

function ymdPlusWeeks(weeks: number): string { const d = new Date(); d.setDate(d.getDate() + weeks * 7); return d.toISOString().slice(0, 10) }
function ymdPlusMonths(n: number): string { const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10) }

// Shared clickable tile (title + optional subtitle) used across every modal.
function Tile({ title, subtitle, onClick, disabled }: { title: string; subtitle?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex min-h-[64px] flex-col justify-center rounded-lg border-2 border-gray-200 bg-white p-3 text-left transition-all hover:border-[#412618] hover:shadow-sm disabled:opacity-50">
      <span className="text-sm font-medium text-[#3A2115]">{title}</span>
      {subtitle && <span className="mt-0.5 text-xs text-gray-600">{subtitle}</span>}
    </button>
  )
}

interface Props {
  locale:        Locale
  initialSubs:   DashSub[]
  lastCancelled: LastCancelled | null
  authUserId:    string
  loyaltyPct:    number
  loyaltyTier:   string
}

export default function ActiveSubscriptions({ locale, initialSubs, lastCancelled, authUserId, loyaltyPct, loyaltyTier }: Props) {
  const t  = useTranslations('account')
  const tp = useTranslations('product')
  const [subs, setSubs]         = useState<DashSub[]>(initialSubs)
  const [busy, setBusy]         = useState<string | null>(null)
  const [editing, setEditing]   = useState<{ sub: DashSub; section: EditorSection } | null>(null)
  const [pausing, setPausing]   = useState<DashSub | null>(null)
  const [canceling, setCanceling] = useState<DashSub | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoredDate, setRestoredDate] = useState<string | null>(null)

  const grindLabel = (g: string) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))
  const fmtDate = (d: string) => fmtDateL(d, locale)

  async function doPause(sub: DashSub, pausedUntil: string | null) {
    setBusy(sub.id)
    const nowIso = new Date().toISOString()
    await createClient().from('subscriptions').update({ status: 'paused', paused_at: nowIso, paused_until: pausedUntil }).eq('id', sub.id)
    setBusy(null); setPausing(null)
    setSubs(prev => prev.map(s => (s.id === sub.id ? { ...s, status: 'paused', paused_at: nowIso, paused_until: pausedUntil } : s)))
  }

  async function resume(sub: DashSub) {
    setBusy(sub.id)
    const nextDate = ymdPlusWeeks(sub.interval_weeks)
    await createClient().from('subscriptions').update({ status: 'active', paused_at: null, paused_until: null, next_delivery_date: nextDate }).eq('id', sub.id)
    setBusy(null)
    setSubs(prev => prev.map(s => (s.id === sub.id ? { ...s, status: 'active', paused_at: null, paused_until: null, next_delivery_date: nextDate } : s)))
  }

  function toEditorSub(s: DashSub): EditorSub {
    return {
      id: s.id,
      items: (s.items ?? []).map(it => ({
        product_id: it.product_id ?? null,
        name:       it.name,
        weight:     (it.weight === 500 ? 500 : it.weight === 1000 ? 1000 : 250),
        grind:      (it.grind === 'ground' ? 'ground' : 'beans'),
        quantity:   it.quantity || 1,
        price:      it.price ?? 0,
      })),
      interval_weeks:     s.interval_weeks,
      next_delivery_date: s.next_delivery_date,
      delivery_method:    s.delivery_method,
      delivery_address:   (s.delivery_address as Record<string, unknown> | null),
    }
  }

  function onEditorSaved(patch: { items: EditorItem[]; interval_weeks: number; next_delivery_date: string; delivery_method: string; delivery_address: Record<string, unknown> }) {
    const id = editing?.sub.id
    setEditing(null)
    if (id) setSubs(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
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
    if (!error && data) await sb.rpc('mark_cancellation_returned', { p_subscription_id: lastCancelled.id })
    setRestoring(false)
    if (error || !data) return
    setSubs(prev => [...prev, { id: data.id, status: 'active', items: lastCancelled.items, interval_weeks: weeks, next_delivery_date: nextDate, paused_at: null, paused_until: null, delivery_method: lastCancelled.delivery_method, delivery_address: lastCancelled.delivery_address }])
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
                    <button type="button" disabled={busy === s.id} onClick={() => setEditing({ sub: s, section: 'schedule' })} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_edit')}</button>
                    <button type="button" disabled={busy === s.id} onClick={() => setPausing(s)} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_pause')}</button>
                    <button type="button" disabled={busy === s.id} onClick={() => setCanceling(s)} className="text-sm font-normal text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:opacity-50">{t('subs_cancel')}</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-500">
                    {s.paused_until ? t('subs_resume_auto', { date: fmtDate(s.paused_until) }) : (s.paused_at ? t('subs_paused_since', { date: fmtDate(s.paused_at) }) : '')}
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

      {editing && (
        <SubscriptionEditor sub={toEditorSub(editing.sub)} locale={locale} loyaltyPct={loyaltyPct} initialSection={editing.section}
          onClose={() => setEditing(null)} onSaved={onEditorSaved} />
      )}

      {pausing && (
        <PauseModal locale={locale} busy={busy === pausing.id} onClose={() => setPausing(null)}
          onPick={(months) => doPause(pausing, months == null ? null : ymdPlusMonths(months))} />
      )}

      {canceling && (
        <ExitSurvey
          sub={canceling} loyaltyPct={loyaltyPct} loyaltyTier={loyaltyTier}
          onClose={() => setCanceling(null)}
          onDone={(r) => {
            const now = new Date().toISOString()
            if (r.type === 'paused') setSubs(prev => prev.map(s => (s.id === canceling.id ? { ...s, status: 'paused', paused_at: now, paused_until: r.pausedUntil } : s)))
            else if (r.type === 'cancelled') setSubs(prev => prev.filter(s => s.id !== canceling.id))
            else if (r.type === 'stayed' && r.patch) setSubs(prev => prev.map(s => (s.id === canceling.id ? { ...s, ...r.patch } : s)))
            const openEdit = r.type === 'edit' ? { sub: canceling, section: r.section } : null
            setCanceling(null)
            if (openEdit) setEditing(openEdit)
          }} />
      )}

      {restoredDate && (
        <Modal title={t('restore_title')} onClose={() => setRestoredDate(null)}
          footer={
            <button type="button" onClick={() => setRestoredDate(null)} className="w-full rounded-full bg-[#412618] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] sm:w-auto sm:min-w-[8rem]">OK</button>
          }>
          <p className="text-sm text-gray-600">{t('restore_body', { date: restoredDate })}</p>
        </Modal>
      )}
    </section>
  )
}

// ── Pause duration modal ─────────────────────────────────────────────────────
function PauseModal({ locale, busy, onClose, onPick }: { locale: Locale; busy: boolean; onClose: () => void; onPick: (months: number | null) => void }) {
  const t = useTranslations('account')
  return (
    <Modal title={t('pause_title')} subtitle={t('pause_sub')} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Tile disabled={busy} title={t('pause_1m')} subtitle={t('pause_resumes_on', { date: fmtDateL(ymdPlusMonths(1), locale) })} onClick={() => onPick(1)} />
        <Tile disabled={busy} title={t('pause_2m')} subtitle={t('pause_resumes_on', { date: fmtDateL(ymdPlusMonths(2), locale) })} onClick={() => onPick(2)} />
        <Tile disabled={busy} title={t('pause_3m')} subtitle={t('pause_resumes_on', { date: fmtDateL(ymdPlusMonths(3), locale) })} onClick={() => onPick(3)} />
        <Tile disabled={busy} title={t('pause_manual')} subtitle={t('pause_manual_s')} onClick={() => onPick(null)} />
      </div>
    </Modal>
  )
}

// ── Exit survey ──────────────────────────────────────────────────────────────
type ExitResult = { type: 'paused'; pausedUntil: string } | { type: 'cancelled' } | { type: 'stayed'; patch?: Partial<DashSub> } | { type: 'edit'; section: EditorSection }

function ExitSurvey({ sub, loyaltyPct, loyaltyTier, onClose, onDone }: {
  sub: DashSub; loyaltyPct: number; loyaltyTier: string; onClose: () => void; onDone: (r: ExitResult) => void
}) {
  const t = useTranslations('account')
  const [step, setStep] = useState<'reason' | 'offer' | 'confirm'>('reason')
  const [reason, setReason] = useState<ReasonCode | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [busy, setBusy] = useState(false)

  async function callLog(finalAction: string, offeredSolution: string, acceptedSolution: boolean, pausedUntil: string | null) {
    const { error } = await createClient().rpc('log_subscription_cancellation', {
      p_subscription_id:   sub.id,
      p_reason_code:       reason,
      p_reason_text:       reason === 'other' ? (reasonText.trim() || null) : null,
      p_final_action:      finalAction,
      p_offered_solution:  offeredSolution,
      p_accepted_solution: acceptedSolution,
      p_paused_until:      pausedUntil,
    })
    return !error
  }

  async function acceptEdit(offeredSolution: string, section: EditorSection) {
    setBusy(true); const ok = await callLog('stayed', offeredSolution, true, null); setBusy(false)
    if (ok) onDone({ type: 'edit', section })
  }
  async function acceptInterval(weeks: number) {
    setBusy(true)
    const nextDate = ymdPlusWeeks(weeks)
    await createClient().from('subscriptions').update({ interval_weeks: weeks, next_delivery_date: nextDate }).eq('id', sub.id)
    const ok = await callLog('stayed', 'change_interval', true, null)
    setBusy(false)
    if (ok) onDone({ type: 'stayed', patch: { interval_weeks: weeks, next_delivery_date: nextDate } })
  }
  async function acceptDiscount() {
    setBusy(true); const ok = await callLog('stayed', 'show_discount', true, null); setBusy(false)
    if (ok) onDone({ type: 'stayed' })
  }
  async function acceptPause(months: number) {
    setBusy(true)
    const pausedUntil = ymdPlusMonths(months)
    const ok = await callLog('paused', `pause_${months}m`, true, pausedUntil)
    setBusy(false)
    if (ok) onDone({ type: 'paused', pausedUntil })
  }
  async function confirmCancel() {
    setBusy(true); const ok = await callLog('cancelled', REASON_OFFER[reason as ReasonCode], false, null); setBusy(false)
    if (ok) onDone({ type: 'cancelled' })
  }
  async function stay() {
    setBusy(true); await callLog('stayed', REASON_OFFER[reason as ReasonCode], false, null); setBusy(false)
    onDone({ type: 'stayed' })
  }

  const stillCancel = <button type="button" disabled={busy} onClick={() => setStep('confirm')} className="mt-2 w-full text-center text-sm font-normal text-gray-500 hover:text-gray-700 disabled:opacity-50">{t('exit_still_cancel')}</button>

  // Step 1 — reasons
  if (step === 'reason') {
    return (
      <Modal title={t('exit_title')} subtitle={t('exit_sub')} onClose={onClose}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REASONS.map(code => (
            <Tile key={code} title={t(`reason_${code}_t`)} subtitle={t(`reason_${code}_s`)}
              onClick={() => { setReason(code); if (code !== 'other') setStep('offer') }} />
          ))}
        </div>
        {reason === 'other' && (
          <>
            <textarea value={reasonText} maxLength={500} onChange={e => setReasonText(e.target.value)} rows={3} placeholder={t('exit_other_ph')} className="input mt-3 w-full resize-none text-sm" />
            <button type="button" onClick={() => setStep('offer')} className="btn btn-primary mt-3 w-full text-sm">{t('exit_continue')}</button>
          </>
        )}
      </Modal>
    )
  }

  // Step 2 — per-reason retention offer
  if (step === 'offer') {
    if (reason === 'bad_taste') return (
      <Modal title={t('offer_taste_title')} subtitle={t('offer_taste_sub')} onClose={onClose}>
        <div className="flex flex-col gap-3">
          <Tile disabled={busy} title={t('offer_change_composition')} onClick={() => acceptEdit('change_composition', 'composition')} />
        </div>{stillCancel}
      </Modal>
    )
    if (reason === 'too_often') return (
      <Modal title={t('offer_often_title')} subtitle={t('offer_often_sub')} onClose={onClose}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile disabled={busy} title={t('offer_interval_6')} onClick={() => acceptInterval(6)} />
          <Tile disabled={busy} title={t('offer_interval_8')} onClick={() => acceptInterval(8)} />
        </div>{stillCancel}
      </Modal>
    )
    if (reason === 'too_expensive') return (
      <Modal title={t('offer_price_title')} subtitle={t('offer_price_sub')} onClose={onClose}>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-[#3A2115]">
          <p>{t('offer_price_level', { tier: loyaltyTier, pct: loyaltyPct })}</p>
          <p className="mt-1">{t('offer_price_subscription')}</p>
          <p className="mt-1 font-semibold text-[#412618]">{t('offer_price_total', { total: loyaltyPct + 5 })}</p>
          <p className="mt-1 text-gray-600">{t('offer_price_shipping')}</p>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Tile disabled={busy} title={t('offer_price_stay')} onClick={acceptDiscount} />
        </div>{stillCancel}
      </Modal>
    )
    if (reason === 'delivery_issue') return (
      <Modal title={t('offer_delivery_title')} subtitle={t('offer_delivery_sub')} onClose={onClose}>
        <div className="flex flex-col gap-3">
          <Tile disabled={busy} title={t('offer_change_delivery')} onClick={() => acceptEdit('change_delivery', 'delivery')} />
        </div>{stillCancel}
      </Modal>
    )
    // found_another / other → pause offer
    return (
      <Modal title={t('offer_pause_title')} subtitle={t('offer_pause_sub')} onClose={onClose}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tile disabled={busy} title={t('pause_offer_1m')} onClick={() => acceptPause(1)} />
          <Tile disabled={busy} title={t('pause_offer_2m')} onClick={() => acceptPause(2)} />
          <Tile disabled={busy} title={t('pause_offer_3m')} onClick={() => acceptPause(3)} />
        </div>{stillCancel}
      </Modal>
    )
  }

  // Step 3 — final confirmation
  return (
    <Modal title={t('exit_confirm_title')} onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button type="button" disabled={busy} onClick={stay} className="order-2 w-full rounded-full border border-[#412618] px-5 py-2.5 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 disabled:opacity-50 sm:order-1 sm:w-auto">{t('exit_stay_btn')}</button>
          <button type="button" disabled={busy} onClick={confirmCancel} className="order-1 w-full rounded-full bg-[#412618] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-50 sm:order-2 sm:w-auto">{t('exit_confirm_btn')}</button>
        </div>
      }>
      <p className="text-sm text-gray-600">{t('exit_confirm_sub')}</p>
    </Modal>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ locale, hasCancelled, restoring, onRestore }: { locale: Locale; hasCancelled: boolean; restoring: boolean; onRestore: () => void }) {
  const t = useTranslations('account')
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-md">
      <span aria-hidden className="brand-shimmer absolute inset-x-0 top-0 h-0.5" />
      {!hasCancelled && <div className="text-4xl">📦</div>}
      <h3 className={`text-xl font-semibold text-[#412618] ${hasCancelled ? '' : 'mt-2'}`}>{hasCancelled ? t('empty_title_cancelled') : t('empty_title_new')}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">{hasCancelled ? t('empty_sub_cancelled') : t('empty_sub_new')}</p>
      <ul className="mx-auto mt-4 space-y-1.5 text-left text-sm text-[#5A4A3A]">
        {[t('empty_benefit_1'), t('empty_benefit_2'), t('empty_benefit_3')].map((b, i) => (
          <li key={i} className="flex items-start gap-2"><span aria-hidden className="font-semibold text-[#412618]">✓</span><span>{b}</span></li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        {hasCancelled ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" disabled={restoring} onClick={onRestore}
              className="brand-shimmer w-full rounded-full px-6 py-3 text-sm font-medium text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50 sm:w-auto">
              {restoring ? '…' : t('empty_restore')}
            </button>
            <Link href={`/${locale}/shop/subskrypcja`} className="w-full rounded-full border border-[#412618] px-5 py-2.5 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5 sm:w-auto">{t('empty_new_sub')}</Link>
          </div>
        ) : (
          <Link href={`/${locale}/shop/subskrypcja`} className="inline-block w-full rounded-full bg-[#412618] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] sm:w-auto">{t('subs_empty_cta')}</Link>
        )}
      </div>
    </div>
  )
}
