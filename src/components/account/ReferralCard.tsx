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
      className="rounded-2xl p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(65,38,24,0.06) 0%, rgba(255,255,255,1) 60%)',
        border: '1px solid rgba(65,38,24,0.15)',
        borderTop: '3px solid #412618',
        boxShadow: '0 4px 20px rgba(65,38,24,0.08), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <h2 className="text-xl font-semibold text-[#412618]">{t('card_title')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('card_subtitle')}</p>

      <div className="mt-5 rounded-xl bg-[#F9FAFB] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#412618]">📤 {t('your_code')}</p>
        <p className="mt-1 select-all text-2xl font-bold tracking-wide text-[#412618]">{code}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-[#412618] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]"
          >
            {copied ? t('copied') : t('copy_code')}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[#412618] px-4 py-2 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5"
          >
            {t('share_whatsapp')}
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
