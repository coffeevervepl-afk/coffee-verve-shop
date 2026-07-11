'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { fmtPrice } from '@/lib/pricing'
import LoyaltyCard from '@/components/shop/account/LoyaltyCard'
import TasteProfileForm from '@/components/shop/account/TasteProfileForm'
import ReferralBlock from '@/components/shop/account/ReferralBlock'
import type { Locale } from '@/types/shop'
import { getLoyaltyDiscount } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import { normalizeTelegramUsername } from '@/lib/telegram'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Order {
  id: string; order_number: number; total: number
  status: string; payment_status: string; created_at: string
  shop_order_items: { product_name: string; weight: number; quantity: number }[]
}

export default function AccountPage() {
  const params   = useParams()
  const searchParams = useSearchParams()
  const locale   = params.locale as Locale
  const router   = useRouter()
  const t        = useTranslations('checkout')
  const { user, config, loading, signOut } = useAuth()

  const [orders,        setOrders]        = useState<Order[]>([])
  const [birthday,      setBirthday]      = useState('')
  const [telegram,      setTelegram]      = useState('')
  const [savingBd,      setSavingBd]      = useState(false)
  const [savingTelegram, setSavingTelegram] = useState(false)

  useEffect(() => {
    // TEMP DEBUG: guard redirect disabled to diagnose why useAuth() returns user=null
    // if (!loading && !user) router.push(`/${locale}`)
  }, [loading, user, locale, router])

  useEffect(() => {
    if (searchParams.get('passwordChanged') === '1') {
      toast.success('Пароль успешно изменён')
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    setBirthday(user.birthday ?? '')
    setTelegram(user.telegram ?? '')
    fetch(`/api/account?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
  }, [user])

  async function saveBirthday() {
    if (!user) return
    setSavingBd(true)
    await fetch('/api/account', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: user.email, birthday }),
    })
    toast.success('День рождения сохранён')
    setSavingBd(false)
  }

  async function saveTelegram() {
    if (!user) return
    const normalizedValue = normalizeTelegramUsername(telegram)
    setSavingTelegram(true)
    try {
      await fetch('/api/account', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: user.email, telegram: normalizedValue ?? telegram }),
      })
      setTelegram(normalizedValue ?? '')
      toast.success(t('telegram_saved'))
    } catch {
      toast.error(t('error'))
    } finally {
      setSavingTelegram(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push(`/${locale}`)
  }

  const debugPanel = (
    <div id="debug-log" className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-gray-800">
      <p>loading: {String(loading)}</p>
      <p>user: {user ? user.email : 'null'}</p>
      <p>session check...</p>
    </div>
  )

  if (loading) return (
    <div className="container py-20 text-center text-brand-muted">
      {debugPanel}
      Загрузка…
    </div>
  )
  if (!user) return (
    <div className="container py-20 text-center text-brand-muted">
      {debugPanel}
      <p>Guard временно отключён — user отсутствует, но редиректа нет.</p>
    </div>
  )

  const discount = getLoyaltyDiscount(user.loyalty_level, config)

  return (
    <div className="container py-10 max-w-2xl">
      {debugPanel}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <button onClick={handleSignOut} className="text-sm text-brand-muted underline">
          Выйти
        </button>
      </div>

      <div className="space-y-6">
        {/* Loyalty card */}
        <LoyaltyCard user={user} config={config} />

        {/* Referral */}
        <ReferralBlock referralCode={user.referral_code} locale={locale} />

        {/* Taste profile */}
        <TasteProfileForm
          initial={user.taste_profile as any}
          email={user.email}
          onSave={() => {}}
        />

        {/* Telegram */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
          <h3 className="font-semibold text-sm mb-3">{t('telegram')}</h3>
          <p className="text-xs text-brand-muted mb-3">{t('telegram_help')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder={t('telegram_placeholder')}
              className="input flex-1"
            />
            <button
              onClick={saveTelegram}
              disabled={savingTelegram}
              className="btn btn-outline text-sm"
            >
              {savingTelegram ? '…' : t('save')}
            </button>
          </div>
        </div>

        {/* Birthday */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
          <h3 className="font-semibold text-sm mb-3">День рождения</h3>
          <p className="text-xs text-brand-muted mb-3">
            Подарим персональный промокод в ваш день рождения 🎂
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={saveBirthday}
              disabled={savingBd}
              className="btn btn-outline text-sm"
            >
              {savingBd ? '…' : t('save')}
            </button>
          </div>
        </div>

        {/* Order history */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden">
          <div className="p-5 border-b border-brand-border">
            <h3 className="font-semibold text-sm">История заказов</h3>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">
              Заказов пока нет
              <div className="mt-3">
                <Link href={`/${locale}`} className="btn btn-primary text-sm px-6 py-2">
                  За кофе →
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {orders.map(order => (
                <div key={order.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      Заказ #{order.order_number}
                      <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {order.payment_status === 'paid' ? 'Оплачен' : order.payment_status}
                      </span>
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {order.shop_order_items
                        .map(i => `${i.product_name} ${i.weight}g ×${i.quantity}`)
                        .join(', ')}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">{fmtPrice(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
