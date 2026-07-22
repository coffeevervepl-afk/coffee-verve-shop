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
    <section className="rounded-3xl bg-[#412618] p-6 text-white shadow-sm md:p-8">
      <h2 className="text-xl font-bold">{t('card_title')}</h2>
      <p className="mt-1 text-sm text-white/70">{t('card_subtitle')}</p>

      <div className="mt-5 rounded-2xl bg-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-white/60">📤 {t('your_code')}</p>
        <p className="mt-1 select-all text-2xl font-bold tracking-wide">{code}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#412618] transition hover:bg-white/90"
          >
            {copied ? t('copied') : t('copy_code')}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t('share_whatsapp')}
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
        <span>{t('stat_invited')}: <b className="text-white">{invited}</b></span>
        <span>{t('stat_available')}: <b className="text-white">{available}</b></span>
      </div>

      <Link
        href={`/${locale}/referral`}
        className="mt-4 inline-block text-sm font-medium text-white/80 underline underline-offset-2 hover:text-white"
      >
        {t('how_it_works')} →
      </Link>
    </section>
  )
}
