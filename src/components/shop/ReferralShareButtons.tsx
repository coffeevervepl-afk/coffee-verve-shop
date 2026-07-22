'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'

export default function ReferralShareButtons({ locale, code }: { locale: Locale; code: string }) {
  const t = useTranslations('referral')
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://coffeeverve.pl/${locale}/shop?ref=${encodeURIComponent(code)}`
  const waText   = `${t('share_message')} ${shareUrl}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-white/60">📤 {t('your_code')}</p>
      <p className="mt-1 select-all text-2xl font-bold tracking-wide">{code}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#412618] transition hover:bg-white/90">
          {copied ? t('copied') : t('copy_code')}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
          className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
          {t('share_whatsapp')}
        </a>
      </div>
    </div>
  )
}
