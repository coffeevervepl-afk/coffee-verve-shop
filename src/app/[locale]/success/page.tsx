'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/hooks/useCartStore'
import type { Locale } from '@/types/shop'

const DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)

export default function SuccessPage() {
  const t           = useTranslations('success')
  const params      = useParams()
  const locale      = params.locale as Locale
  const searchParams = useSearchParams()
  const orderId     = searchParams.get('order')
  const setItems    = useCartStore(s => s.setItems)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    // Clear cart
    setItems([])

    if (!orderId) return
    const sb = createClient()
    sb.from('shop_orders')
      .select('order_number, customer_email, payment_status')
      .eq('id', orderId)
      .single()
      .then(({ data }) => setOrder(data))
  }, [orderId, setItems])

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="animate-fade-up max-w-md">
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

        <p className="mb-8 text-sm text-brand-muted">{t('tracking')}</p>

        {/* Register upsell */}
        <div className="mb-8 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5 text-left">
          <p className="font-semibold">{t('register_cta')}</p>
          <p className="mt-1 text-sm text-brand-muted">
            {t('register_desc', { pct: DISCOUNT_PCT })}
          </p>
          <button className="btn btn-primary mt-3 w-full">
            {t('register_cta')}
          </button>
        </div>

        <Link href={`/${locale}`} className="btn btn-outline">
          {t('continue')}
        </Link>
      </div>
    </div>
  )
}
