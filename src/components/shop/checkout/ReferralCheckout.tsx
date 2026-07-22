'use client'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'

interface BonusProduct { id: string; name: string; image: string | null }

export interface ReferralSelection {
  code:                 string | null
  bonusPackProductId:   string | null
  useBonus:             boolean
  bonusRedeemProductId: string | null
}

interface Props {
  locale:   Locale
  email:    string
  subtotal: number
  onChange: (sel: ReferralSelection) => void
}

type Status = 'idle' | 'checking' | 'valid' | 'invalid'

export default function ReferralCheckout({ locale, email, subtotal, onChange }: Props) {
  const t = useTranslations('checkout')
  const [code, setCode]         = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [reason, setReason]     = useState<string>('')
  const [products, setProducts] = useState<BonusProduct[]>([])
  const [packId, setPackId]     = useState('')
  const [available, setAvailable] = useState(0)
  const [useBonus, setUseBonus]   = useState(false)
  const [redeemId, setRedeemId]   = useState('')

  // Load bonus-pack catalog + accumulated bonuses; prefill code from ?ref capture.
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('cv_ref') : null
    if (stored) setCode(stored)
    fetch(`/api/referral/context?locale=${locale}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.products ?? [])
        setAvailable(d.availableBonuses ?? 0)
        if (d.products?.[0]) { setPackId(d.products[0].id); setRedeemId(d.products[0].id) }
      })
      .catch(() => {})
  }, [locale])

  const validate = useCallback(async (theCode: string) => {
    if (!theCode.trim()) { setStatus('idle'); return }
    setStatus('checking')
    try {
      const res = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: theCode.trim(), email, subtotal }),
      })
      const d = await res.json()
      if (d.valid) { setStatus('valid'); setReason('') }
      else { setStatus('invalid'); setReason(d.reason ?? 'not_found') }
    } catch {
      setStatus('invalid'); setReason('not_found')
    }
  }, [email, subtotal])

  // Auto-validate a prefilled code once an email is available.
  useEffect(() => {
    if (status === 'idle' && code.trim() && email.trim()) validate(code)
  }, [code, email, status, validate])

  // Report the current selection upward (onChange is a stable useState setter).
  useEffect(() => {
    onChange({
      code:                 code.trim() || null,
      bonusPackProductId:   status === 'valid' ? (packId || null) : null,
      useBonus,
      bonusRedeemProductId: useBonus ? (redeemId || null) : null,
    })
  }, [code, status, packId, useBonus, redeemId, onChange])

  return (
    <section className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      <label className="mb-1 block text-sm font-medium text-[#3A2115]">{t('ref_title')}</label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setStatus('idle') }}
          placeholder={t('ref_placeholder')}
          className="input flex-1 text-sm uppercase"
        />
        <button type="button" onClick={() => validate(code)} disabled={status === 'checking'} className="btn btn-outline text-sm disabled:opacity-60">
          {status === 'checking' ? '…' : t('ref_apply')}
        </button>
      </div>

      {status === 'valid' && (
        <div className="mt-3">
          <p className="text-sm font-medium text-[#3A2115]">✓ {t('ref_valid')}</p>
          <select value={packId} onChange={e => setPackId(e.target.value)} className="input mt-2 text-sm">
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {status === 'invalid' && (
        <p className="mt-2 text-sm text-[#7A5A3A]">{t(`ref_invalid_${reason}`)}</p>
      )}

      {available > 0 && (
        <div className="mt-4 rounded-xl bg-[#412618]/5 p-3">
          <label className="flex items-start gap-2 text-sm text-[#3A2115]">
            <input type="checkbox" checked={useBonus} onChange={e => setUseBonus(e.target.checked)} className="mt-0.5" />
            <span>🎁 {t('ref_bonus_available', { n: available })}</span>
          </label>
          {useBonus && (
            <select value={redeemId} onChange={e => setRedeemId(e.target.value)} className="input mt-2 text-sm">
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      )}
    </section>
  )
}
