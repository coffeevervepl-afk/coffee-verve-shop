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
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-[#F4F3F0] p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div>
          <p className="font-bold">{t('title')}</p>
          <p className="text-sm text-[#6E6D68]">{t('subtitle', { pct: DISCOUNT_PCT })}</p>
        </div>
      </div>
      <Link
        href={`/${locale}/account/register`}
        className="login-hint-cta flex-shrink-0 whitespace-nowrap rounded-full border-2 border-[#3A2115] px-4 py-2 text-sm font-semibold text-[#3A2115] transition-colors duration-200 hover:bg-[#3A2115] hover:text-white"
      >
        {t('cta')}
      </Link>

      <style jsx>{`
        .login-hint-cta {
          animation: loginHintPulse 2s ease-in-out infinite;
        }
        @keyframes loginHintPulse {
          0%   { box-shadow: 0 0 0 0 rgba(58, 33, 21, 0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(58, 33, 21, 0); }
          100% { box-shadow: 0 0 0 0 rgba(58, 33, 21, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-hint-cta {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
