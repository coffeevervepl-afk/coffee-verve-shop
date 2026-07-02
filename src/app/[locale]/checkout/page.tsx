'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/hooks/useCartStore'
import { calcPricing, fmtPrice } from '@/lib/pricing'
import type { PromoDiscount } from '@/lib/pricing'
import type { CheckoutFormData, DeliveryType, Locale } from '@/types/shop'
import OrderSummary from '@/components/shop/checkout/OrderSummary'
import ContactForm from '@/components/shop/checkout/ContactForm'
import DeliveryForm from '@/components/shop/checkout/DeliveryForm'
import RegisterOffer from '@/components/shop/checkout/RegisterOffer'
import PromoCodeField from '@/components/shop/checkout/PromoCodeField'

const DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)

export default function CheckoutPage() {
  const t         = useTranslations('checkout')
  const params    = useParams()
  const locale    = params.locale as Locale
  const router    = useRouter()
  const items     = useCartStore(s => s.items)

  const [delivery,  setDelivery]  = useState<DeliveryType>('paczkomat')
  const [register,  setRegister]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [form,      setForm]      = useState<Partial<CheckoutFormData>>({})
  const [promo,     setPromo]     = useState<PromoDiscount | null>(null)

  // loyalty pct: if registered, use DISCOUNT_PCT as base; promo may override
  const loyaltyPct = register ? DISCOUNT_PCT : 0
  const pricing    = calcPricing(items, delivery, register, loyaltyPct, promo)
  const subtotal   = items.reduce((s, i) => s + i.unit_price * i.qty, 0)

  useEffect(() => {
    if (items.length === 0) router.push(`/${locale}`)
  }, [items, locale, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items, customer: form, delivery, register, pricing, promo, locale }),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const { redirectUrl, orderId } = await res.json()
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        router.push(`/${locale}/success?order=${orderId}`)
      }
    } catch {
      alert(t('order_placed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 md:py-16">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1fr_380px]">

        {/* Left */}
        <div className="space-y-8">
          <ContactForm
            values={form}
            onChange={v => setForm(prev => ({ ...prev, ...v }))}
          />
          <DeliveryForm
            delivery={delivery}
            onDeliveryChange={setDelivery}
            values={form}
            onChange={v => setForm(prev => ({ ...prev, ...v }))}
          />

          {/* Promo code */}
          <section>
            <PromoCodeField
              email={(form as any).email ?? ''}
              subtotal={subtotal}
              onApply={setPromo}
              applied={promo}
            />
            {pricing.discount_label && pricing.discount_source !== 'none' && (
              <p className="mt-2 text-xs text-brand-gold font-medium">
                ✓ {t('best_discount')}: {pricing.discount_label}
              </p>
            )}
          </section>

          <RegisterOffer
            discountPct={DISCOUNT_PCT}
            register={register}
            onToggle={setRegister}
            pricing={pricing}
            values={form}
            onChange={v => setForm(prev => ({ ...prev, ...v }))}
          />

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn btn-primary w-full py-4 text-base disabled:opacity-60"
          >
            {loading ? '…' : `${t('pay')} ${fmtPrice(pricing.total)}`}
          </button>
          <p className="text-center text-xs text-brand-muted">{t('guest_hint')}</p>
        </div>

        {/* Right: summary */}
        <OrderSummary items={items} pricing={pricing} locale={locale} />
      </form>
    </div>
  )
}
