'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/hooks/useCartStore'
import { toast } from 'react-hot-toast'
import TasteProfileForm from '@/components/shop/account/TasteProfileForm'
import type { Locale } from '@/types/shop'

const DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)

export default function SuccessPage() {
  const t           = useTranslations('success')
  const params      = useParams()
  const locale      = params.locale as Locale
  const searchParams = useSearchParams()
  const orderId     = searchParams.get('order')
  const setItems    = useCartStore(s => s.setItems)

  const [order,       setOrder]       = useState<any>(null)
  const [step,        setStep]        = useState<'confirm'|'register'|'taste'|'done'>('confirm')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [regLoading,  setRegLoading]  = useState(false)
  const [tasteProfile, setTasteProfile] = useState<any>(null)

  useEffect(() => {
    setItems([])
    if (!orderId) return
    const sb = createClient()
    sb.from('shop_orders')
      .select('id,order_number,customer_email,customer_name,total,payment_status')
      .eq('id', orderId)
      .single()
      .then(({ data }) => setOrder(data))
  }, [orderId, setItems])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!order || password.length < 8) {
      toast.error('Пароль должен быть минимум 8 символов')
      return
    }
    setRegLoading(true)
    try {
      const res = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    order.customer_email,
          password,
          name:     order.customer_name,
          orderId:  order.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Sign in automatically
      const sb = createClient()
      const { error: signInErr } = await sb.auth.signInWithPassword({
        email: order.customer_email, password,
      })
      if (signInErr && !signInErr.message.includes('Email not confirmed')) {
        console.warn('Auto sign-in:', signInErr.message)
      }

      toast.success('Аккаунт создан!')
      setStep('taste')
    } catch (err: any) {
      toast.error(err.message ?? 'Ошибка регистрации')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="animate-fade-up w-full max-w-md">
        <CheckCircle className="mx-auto mb-6 text-green-500" size={64} strokeWidth={1.5} />
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>

        {order && (
          <>
            <p className="mb-1 text-lg text-brand-muted">
              {t('subtitle', { number: order.order_number })}
            </p>
            <p className="mb-8 text-sm text-brand-muted">
              {t('email_sent', { email: order.customer_email })}
            </p>
          </>
        )}

        {/* ── Step: offer registration ──────────────────────────────── */}
        {step === 'confirm' && order && (
          <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/5 p-6 text-left mb-6">
            <p className="text-lg font-bold mb-1">Сохрани скидку {DISCOUNT_PCT}% навсегда</p>
            <p className="text-sm text-brand-muted mb-4">
              Создай аккаунт — скидка будет применяться автоматически к каждому заказу.
              Email уже известен.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('register')}
                className="btn btn-primary flex-1"
              >
                Создать аккаунт
              </button>
              <button onClick={() => setStep('done')} className="btn btn-outline">
                Пропустить
              </button>
            </div>
          </div>
        )}

        {/* ── Step: password form ────────────────────────────────────── */}
        {step === 'register' && order && (
          <form onSubmit={handleRegister} className="rounded-2xl border border-brand-border bg-brand-surface p-6 text-left mb-6 space-y-4">
            <div>
              <p className="font-semibold mb-1">Придумай пароль</p>
              <p className="text-sm text-brand-muted">Аккаунт для {order.customer_email}</p>
            </div>
            <div className="relative">
              <input
                required
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="input pr-10"
                minLength={8}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={regLoading} className="btn btn-primary w-full disabled:opacity-60">
              {regLoading ? '…' : `Создать аккаунт и получить −${DISCOUNT_PCT}%`}
            </button>
            <button type="button" onClick={() => setStep('done')} className="w-full text-xs text-brand-muted underline">
              Пропустить
            </button>
          </form>
        )}

        {/* ── Step: taste profile ────────────────────────────────────── */}
        {step === 'taste' && order && (
          <div className="mb-6 text-left">
            <p className="text-center font-semibold mb-2">Расскажи о вкусовых предпочтениях</p>
            <p className="text-center text-sm text-brand-muted mb-4">
              Мы подберём кофе именно под тебя. Можно пропустить.
            </p>
            <TasteProfileForm
              initial={tasteProfile}
              email={order.customer_email}
              onSave={p => { setTasteProfile(p); setStep('done') }}
            />
            <button onClick={() => setStep('done')} className="mt-3 w-full text-xs text-brand-muted underline">
              Пропустить
            </button>
          </div>
        )}

        {/* ── Final links ───────────────────────────────────────────── */}
        {(step === 'done' || !order) && (
          <div className="space-y-3">
            <Link href={`/${locale}/account`} className="btn btn-primary w-full">
              Мой кабинет
            </Link>
            <Link href={`/${locale}`} className="btn btn-outline w-full">
              {t('continue')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
