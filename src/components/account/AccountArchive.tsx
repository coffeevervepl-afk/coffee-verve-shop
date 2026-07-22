'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

interface SubItem { name: string; weight: number; grind: string; quantity: number }
export interface ArchSub {
  id:             string
  items:          SubItem[]
  interval_weeks: number
  cancelled_at:   string | null
}

interface Props {
  locale:          Locale
  cancelledSubs:   ArchSub[]
  ordersCount:     number
  reviewsCount:    number
}

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', pl: 'pl-PL', ua: 'uk-UA' }

function nextDateFrom(intervalWeeks: number): string {
  const d = new Date()
  d.setDate(d.getDate() + intervalWeeks * 7)
  return d.toISOString().slice(0, 10)
}

export default function AccountArchive({ locale, cancelledSubs, ordersCount, reviewsCount }: Props) {
  const t = useTranslations('account')
  const td = useTranslations('dashboard')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<ArchSub | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const total = cancelledSubs.length + ordersCount + reviewsCount
  if (total === 0) return null

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(DATE_LOCALE[locale])

  async function resume(sub: ArchSub) {
    setBusy(true)
    const nextDate = nextDateFrom(sub.interval_weeks)
    const sb = createClient()
    await sb.from('subscriptions')
      .update({ status: 'active', cancelled_at: null, next_delivery_date: nextDate })
      .eq('id', sub.id)
    setBusy(false)
    setConfirm(null)
    setDone(fmtDate(nextDate))
  }

  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button type="button" onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-[15px] font-semibold text-[#3A2115]">{t('archive_title', { n: total })}</span>
        <span aria-hidden className="text-gray-400">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {cancelledSubs.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">{t('archive_cancelled_subs')}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {cancelledSubs.map(s => (
                  <div key={s.id} className="flex flex-col rounded-2xl border border-brand-border bg-[#F4F3F0] p-4 opacity-70">
                    <span className="self-start rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                      {t('archive_cancelled_on', { date: s.cancelled_at ? fmtDate(s.cancelled_at) : '—' })}
                    </span>
                    <ul className="mt-2 space-y-0.5 text-sm text-[#3A2115]">
                      {(s.items ?? []).map((it, i) => (
                        <li key={i} className="truncate">{it.name} · {wLabel(it.weight)}{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''}</li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => setConfirm(s)}
                      className="mt-3 self-start rounded-full bg-[#412618] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2A1810]">
                      {t('archive_resume')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href={`/${locale}/account/orders`} className="font-medium text-[#412618] underline underline-offset-2">
              {t('archive_all_orders', { n: ordersCount })}
            </Link>
            <span className="text-gray-500">{t('archive_my_reviews', { n: reviewsCount })}</span>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setConfirm(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] text-[#3A2115]">
              {t('archive_resume_confirm', { date: fmtDate(nextDateFrom(confirm.interval_weeks)) })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="btn btn-outline text-sm">{t('subs_cancel_edit')}</button>
              <button type="button" disabled={busy} onClick={() => resume(confirm)} className="btn btn-primary text-sm disabled:opacity-60">
                {t('archive_resume')}
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setDone(null); router.refresh() }}>
          <div className="w-full max-w-sm rounded-3xl bg-[#412618] p-8 text-center text-white" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold">{t('archive_resumed_title')}</p>
            <p className="mt-2 text-sm text-white/80">{t('archive_resumed_body', { date: done })}</p>
            <button type="button" onClick={() => { setDone(null); router.refresh() }} className="mt-6 rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#412618]">
              {td('reviews_close')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
