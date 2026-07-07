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
import { useAuth } from '@/hooks/useAuth'
import { getLoyaltyDiscount } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'

const DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)

export default function CheckoutPage() {
  const t         = useTranslations('checkout')
  const params    = useParams()
  const locale    = params.locale as Locale
  const router    = useRouter()
  const items     = useCartStore(s => s.items)
  const { user, config } = useAuth()

  const [delivery,  setDelivery]  = useState<DeliveryType>('paczkomat')
  const [register,  setRegister]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [form,      setForm]      = useState<Partial<CheckoutFormData>>({})
  const [promo,     setPromo]     = useState<PromoDiscount | null>(null)
  const [knownUser, setKnownUser] = useState<{ exists: boolean; discount_pct: number }>({ exists: false, discount_pct: 0 })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const isAuthenticated = !!user
  const registerAtCheckout = register && !isAuthenticated
  const loyaltyPct = isAuthenticated
    ? getLoyaltyDiscount(user.loyalty_level, config)
    : registerAtCheckout ? DISCOUNT_PCT : 0
  const pricing = calcPricing(
    items,
    delivery,
    isAuthenticated || registerAtCheckout,
    loyaltyPct,
    promo,
    user?.is_b2b ?? false,
    Number(user?.b2b_discount ?? 0),
  )
  const subtotal   = items.reduce((s, i) => s + i.unit_price * i.qty, 0)

  useEffect(() => {
    if (items.length === 0) router.push(`/${locale}`)
  }, [items, locale, router])

  useEffect(() => {
    if (!user) return
    setKnownUser({ exists: false, discount_pct: 0 })
    setForm(prev => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
      telegram: prev.telegram || user.telegram || '',
    }))
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (registerAtCheckout && String((form as any).password ?? '').length < 6) {
      alert(t('password_min_6'))
      return
    }

    setLoading(true)
    const referralCode = typeof window !== 'undefined' ? localStorage.getItem('cv_ref') : null
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items,
          customer: form,
          delivery,
          register: registerAtCheckout,
          pricing,
          promo,
          locale,
          referralCode,
        }),
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

  async function checkKnownAccount(email: string) {
    if (isAuthenticated) return
    const normalized = email.trim().toLowerCase()
    if (!normalized) {
      setKnownUser({ exists: false, discount_pct: 0 })
      return
    }

    const res = await fetch(`/api/account/check-email?email=${encodeURIComponent(normalized)}`)
    if (!res.ok) return
    const data = await res.json()
    setKnownUser({ exists: !!data.exists, discount_pct: Number(data.discount_pct ?? 0) })
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    const email = String((form as any).email ?? '').trim()
    if (!email || !loginPassword) return

    setLoggingIn(true)
    try {
      const sb = createClient()
      const { error } = await sb.auth.signInWithPassword({ email, password: loginPassword })
      if (error) throw error
      setShowLoginModal(false)
      setLoginPassword('')
      setKnownUser({ exists: false, discount_pct: 0 })
    } catch (err: any) {
      alert(err?.message ?? t('error'))
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="container py-8 md:py-16">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1fr_380px]">

        {/* Left */}
        <div className="space-y-8">
          {isAuthenticated && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              {t('auth_discount_applied', { pct: Number(user?.discount_pct ?? loyaltyPct) })}
            </div>
          )}

          {!isAuthenticated && knownUser.exists && (
            <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/5 p-4">
              <p className="text-sm font-medium">
                {t('known_user_banner', { pct: knownUser.discount_pct })}
              </p>
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="btn btn-outline mt-3 text-sm"
              >
                {t('login')}
              </button>
            </div>
          )}

          <ContactForm
            values={form}
            onChange={v => setForm(prev => ({ ...prev, ...v }))}
            onEmailBlur={checkKnownAccount}
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

          {!isAuthenticated && (
            <RegisterOffer
              discountPct={DISCOUNT_PCT}
              register={register}
              onToggle={setRegister}
              pricing={pricing}
              values={form}
              onChange={v => setForm(prev => ({ ...prev, ...v }))}
            />
          )}

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

      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{t('login')}</h3>
                <p className="text-sm text-brand-muted">{String((form as any).email ?? '')}</p>
              </div>
              <button type="button" onClick={() => setShowLoginModal(false)} className="text-sm text-brand-muted underline">
                {t('close')}
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Пароль"
                className="input w-full"
              />
              <button type="submit" disabled={loggingIn} className="btn btn-primary w-full">
                {loggingIn ? '…' : t('login')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
