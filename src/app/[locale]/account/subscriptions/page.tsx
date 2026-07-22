'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface SubItem { name: string; weight: number; grind: string; quantity: number }
interface Sub {
  id: string
  status: 'active' | 'paused' | 'cancelled'
  items: SubItem[]
  interval_weeks: number
  next_delivery_date: string
}

const SUB_STATUS: Record<string, { key: string; cls: string }> = {
  active:    { key: 'subs_status_active',    cls: 'bg-[#412618] text-white' },
  paused:    { key: 'subs_status_paused',    cls: 'border border-[#412618] text-[#412618]' },
  cancelled: { key: 'subs_status_cancelled', cls: 'bg-gray-100 text-gray-500' },
}

const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)

export default function AccountSubscriptionsPage() {
  const params = useParams()
  const locale = params.locale as string
  const t  = useTranslations('account')
  const tp = useTranslations('product')
  const { user, loading } = useAuth()
  const [subs, setSubs] = useState<Sub[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoadingSubs(true)
    const supabase = createClient()
    supabase.from('subscriptions')
      .select('id, status, items, interval_weeks, next_delivery_date')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSubs((data as Sub[]) ?? []); setLoadingSubs(false) })
  }, [user])

  if (loading) return <div className="text-center text-brand-muted">{t('loading')}</div>
  if (!user) return null

  const grindLabel = (g: string) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#3A2115]">{t('subs_title')}</h1>
          <p className="text-sm text-brand-muted">{t('subs_subtitle')}</p>
        </div>
        <Link href={`/${locale}/account`} className="btn btn-outline text-sm">{t('back_to_account')}</Link>
      </div>

      {loadingSubs ? (
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-8 text-center text-brand-muted">{t('loading')}</div>
      ) : subs.length === 0 ? (
        <div className="rounded-3xl border border-brand-border bg-brand-surface p-10 text-center">
          <p className="text-brand-muted">{t('subs_empty')}</p>
          <Link href={`/${locale}/shop/subskrypcja`} className="btn btn-primary mt-4 inline-block text-sm">{t('subs_empty_cta')}</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subs.map(s => {
            const st = SUB_STATUS[s.status] ?? SUB_STATUS.cancelled
            return (
              <div key={s.id} className="flex flex-col rounded-3xl border border-brand-border bg-brand-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{t(st.key)}</span>
                  <span className="text-xs text-brand-muted">{t('subs_every', { n: s.interval_weeks })}</span>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-[#3A2115]">
                  {(s.items ?? []).map((it, i) => (
                    <li key={i} className="truncate">
                      {it.name} · {wLabel(it.weight)} · {grindLabel(it.grind)}{(it.quantity || 1) > 1 ? ` × ${it.quantity}` : ''}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-brand-border pt-3">
                  <p className="text-xs text-brand-muted">{t('subs_next')}</p>
                  <p className="text-lg font-bold text-[#412618]">{new Date(s.next_delivery_date).toLocaleDateString('ru-RU')}</p>
                </div>

                <Link href={`/${locale}/account/subscriptions/${s.id}`} className="btn btn-outline btn-sm mt-4 self-start">{t('subs_details')}</Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
