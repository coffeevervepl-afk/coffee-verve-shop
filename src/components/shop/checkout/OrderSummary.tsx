'use client'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { CartItem, Locale, PricingSummary } from '@/types/shop'
import { fmtPrice } from '@/lib/pricing'

interface Props {
  items:   CartItem[]
  pricing: PricingSummary
  locale:  Locale
}

export default function OrderSummary({ items, pricing }: Props) {
  const t = useTranslations('checkout')

  return (
    <aside className="rounded-2xl border border-brand-border p-5 h-fit sticky top-20">
      <h3 className="mb-4 font-semibold">{t('summary')}</h3>

      {/* Items */}
      <ul className="mb-4 space-y-3">
        {items.map(item => (
          <li key={`${item.product_id}-${item.weight}`} className="flex gap-3 items-center">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-border/20">
              <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-brand-muted">{item.weight}g × {item.qty}</p>
            </div>
            <span className="text-sm font-semibold flex-shrink-0">
              {fmtPrice(item.unit_price * item.qty)}
            </span>
          </li>
        ))}
      </ul>

      <hr className="divider" />

      {/* Pricing breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-brand-muted">
          <span>{t('subtotal')}</span>
          <span>{fmtPrice(pricing.subtotal)}</span>
        </div>

        {pricing.discount_pct > 0 && (
          <div className="flex justify-between text-brand-gold">
            <span>{t('discount')} −{pricing.discount_pct}%</span>
            <span>−{fmtPrice(pricing.discount_amount)}</span>
          </div>
        )}

        <div className="flex justify-between text-brand-muted">
          <span>{t('delivery_cost')}</span>
          <span>
            {pricing.is_free_delivery ? t('free') : fmtPrice(pricing.delivery_cost)}
          </span>
        </div>
      </div>

      <hr className="divider" />

      <div className="flex items-center justify-between font-bold text-lg">
        <span>{t('total')}</span>
        <span>{fmtPrice(pricing.total)}</span>
      </div>
    </aside>
  )
}
