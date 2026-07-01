'use client'
import { useTranslations } from 'next-intl'
import type { DeliveryType } from '@/types/shop'

interface Props {
  delivery:         DeliveryType
  onDeliveryChange: (d: DeliveryType) => void
  values:           Record<string, any>
  onChange:         (v: Record<string, string>) => void
}

const DELIVERY_OPTIONS: { type: DeliveryType; price: string }[] = [
  { type: 'paczkomat', price: '14,99 zł' },
  { type: 'courier',   price: '19,99 zł' },
  { type: 'pickup',    price: '0 zł' },
]

export default function DeliveryForm({ delivery, onDeliveryChange, values, onChange }: Props) {
  const t = useTranslations('checkout')

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t('delivery')}</h2>
      <div className="space-y-2">
        {DELIVERY_OPTIONS.map(({ type, price }) => (
          <label
            key={type}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              delivery === type ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border'
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value={type}
              checked={delivery === type}
              onChange={() => onDeliveryChange(type)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className="flex-1 text-sm font-medium">{t(type)}</span>
            <span className="text-sm text-brand-muted">{price}</span>
          </label>
        ))}
      </div>

      {/* Paczkomat picker placeholder */}
      {delivery === 'paczkomat' && (
        <div className="mt-3 rounded-xl border border-brand-border p-4">
          <button
            type="button"
            className="btn btn-outline w-full text-sm"
            onClick={() => alert('InPost Paczkomat widget — подключается через InPost API')}
          >
            {values.paczkomat_name
              ? `${t('paczkomat_chosen')}: ${values.paczkomat_name}`
              : t('choose_paczkomat')}
          </button>
        </div>
      )}

      {/* Courier fields */}
      {delivery === 'courier' && (
        <div className="mt-3 space-y-3">
          <input
            required
            type="text"
            placeholder={t('street')}
            value={values.street ?? ''}
            onChange={e => onChange({ street: e.target.value })}
            className="input"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="text"
              placeholder={t('postal')}
              value={values.postal_code ?? ''}
              onChange={e => onChange({ postal_code: e.target.value })}
              className="input"
            />
            <input
              required
              type="text"
              placeholder={t('city')}
              value={values.city ?? ''}
              onChange={e => onChange({ city: e.target.value })}
              className="input"
            />
          </div>
        </div>
      )}
    </section>
  )
}
