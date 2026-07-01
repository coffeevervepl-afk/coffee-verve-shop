'use client'
import { useTranslations } from 'next-intl'
import type { PricingSummary } from '@/types/shop'
import { fmtPrice } from '@/lib/pricing'

interface Props {
  discountPct: number
  register:    boolean
  onToggle:    (v: boolean) => void
  pricing:     PricingSummary
  values:      Record<string, any>
  onChange:    (v: Record<string, string>) => void
}

export default function RegisterOffer({ discountPct, register, onToggle, pricing, values, onChange }: Props) {
  const t = useTranslations('checkout')

  const guestTotal  = pricing.subtotal + pricing.delivery_cost
  const memberTotal = pricing.total

  return (
    <section className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{t('register_cta')}</p>
          <p className="mt-0.5 text-sm text-brand-muted">
            {t('register_desc', { pct: discountPct })}
          </p>
        </div>
        {/* Price comparison */}
        <div className="text-right text-sm flex-shrink-0">
          <p className="text-brand-muted line-through">{fmtPrice(guestTotal)}</p>
          <p className="text-lg font-bold text-brand-gold">{fmtPrice(memberTotal)}</p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={register}
          onChange={e => onToggle(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-gold)] rounded"
        />
        <span className="text-sm font-medium">{t('register_checkbox', { pct: discountPct })}</span>
      </label>

      {register && (
        <div className="mt-3">
          <input
            required={register}
            type="password"
            placeholder={t('password')}
            value={values.password ?? ''}
            onChange={e => onChange({ password: e.target.value })}
            className="input"
            minLength={8}
          />
        </div>
      )}
    </section>
  )
}
