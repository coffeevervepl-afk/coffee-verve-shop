'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'

interface Props {
  locale:    Locale
  code:      string
  invited:   number
  available: number
}

export default function ReferralCard({ locale, code, invited, available }: Props) {
  const t = useTranslations('referral')
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://coffeeverve.pl/${locale}/shop?ref=${encodeURIComponent(code)}`
  const waText   = `${t('share_message')} ${shareUrl}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked — ignore */ }
  }

  return (
    <section
      className="referral-shimmer rounded-2xl p-6 shadow-[0_4px_20px_rgba(65,38,24,0.08)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(65,38,24,0.14)] md:p-8"
      style={{
        // Warm shimmer gradient + animation live in .referral-shimmer (globals.css).
        border: '1px solid rgba(65,38,24,0.15)',
        borderTop: '3px solid #412618',
      }}
    >
      <h2 className="text-xl font-semibold text-[#412618]">{t('card_title')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('card_subtitle')}</p>

      <div className="mt-5 rounded-xl border border-[#E8E7E3] bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#412618]">📤 {t('your_code')}</p>
        <p className="mt-1 select-all text-2xl font-bold tracking-wide text-[#412618]">{code}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copy}
            className="ref-pulse-btn rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {copied ? t('copied') : t('copy_code')}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ref-pulse-btn rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {t('share_whatsapp')}
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(`https://coffeeverve.pl/${locale}/ref/${code}`)}&text=${encodeURIComponent(t('share_message'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ref-pulse-btn rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {t('share_telegram')}
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
        <span>{t('stat_invited')}: <b className="text-[#3A2115]">{invited}</b></span>
        <span>{t('stat_available')}: <b className="text-[#3A2115]">{available}</b></span>
      </div>

      <Link
        href={`/${locale}/referral`}
        className="mt-4 inline-block text-sm font-medium text-[#412618] underline-offset-2 hover:underline"
      >
        {t('how_it_works')} →
      </Link>
    </section>
  )
}
