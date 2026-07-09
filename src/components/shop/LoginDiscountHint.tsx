'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import type { Locale } from '@/types/shop'

const DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)

export default function LoginDiscountHint() {
  const t      = useTranslations('login_hint')
  const params = useParams()
  const locale = params.locale as Locale
  const { user, loading } = useAuth()

  if (loading || user) return null

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-[#F4F3F0] p-2.5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div>
          <p className="text-[12px] font-bold">{t('title')}</p>
          <p className="text-[11px] text-[#6E6D68]">{t('subtitle', { pct: DISCOUNT_PCT })}</p>
        </div>
      </div>
      <Link
        href={`/${locale}/account/register`}
        className="login-hint-cta inline-flex h-[34px] flex-shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[#3A2115] px-4 text-[12px] font-semibold text-[#3A2115]"
      >
        {t('cta')}
      </Link>
    </div>
  )
}
