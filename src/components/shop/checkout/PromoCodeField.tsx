'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tag, X, CheckCircle } from 'lucide-react'
import type { PromoDiscount } from '@/lib/pricing'

interface Props {
  email:      string
  subtotal:   number
  onApply:    (promo: PromoDiscount | null) => void
  applied:    PromoDiscount | null
}

const ERROR_MSGS: Record<string, string> = {
  promo_not_found:    'Промокод не найден или недействителен',
  min_order_not_met:  'Сумма заказа ниже минимальной для этого промокода',
  promo_exhausted:    'Промокод исчерпан',
  already_used:       'Вы уже использовали этот промокод',
  empty_code:         'Введите промокод',
  server_error:       'Ошибка проверки, попробуйте ещё раз',
}

export default function PromoCodeField({ email, subtotal, onApply, applied }: Props) {
  const t = useTranslations('checkout')
  const [code,   setCode]   = useState(applied?.code ?? '')
  const [error,  setError]  = useState<string | null>(null)
  const [busy,   setBusy]   = useState(false)
  const [open,   setOpen]   = useState(false)

  async function apply() {
    if (!code.trim()) { setError(ERROR_MSGS.empty_code); return }
    setBusy(true)
    setError(null)
    try {
      const res  = await fetch('/api/promo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim(), email, orderAmount: subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        onApply({ id: data.id, code: data.code, type: data.type, value: data.value, category: data.category })
        setError(null)
      } else {
        setError(ERROR_MSGS[data.error] ?? data.error)
        onApply(null)
      }
    } catch {
      setError(ERROR_MSGS.server_error)
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    setCode('')
    setError(null)
    onApply(null)
  }

  // Compact toggle
  if (!open && !applied) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-brand-muted underline-offset-2 hover:underline"
      >
        <Tag size={14} />
        {t('promo_have')}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {applied ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">{applied.code}</p>
            <p className="text-xs text-green-600">
              {applied.type === 'percent' ? `−${applied.value}%` : `−${applied.value} zł`}
            </p>
          </div>
          <button type="button" onClick={remove} className="text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), apply())}
            placeholder={t('promo_placeholder')}
            className="input flex-1 font-mono tracking-wider text-sm uppercase"
          />
          <button
            type="button"
            onClick={apply}
            disabled={busy}
            className="btn btn-outline flex-shrink-0 text-sm disabled:opacity-60"
          >
            {busy ? '…' : t('promo_apply')}
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(null) }}
            className="text-brand-muted hover:text-brand-text p-2">
            <X size={16} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
