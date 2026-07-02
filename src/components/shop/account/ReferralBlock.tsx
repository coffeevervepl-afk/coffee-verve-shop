'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props { referralCode: string | null; locale: string }

export default function ReferralBlock({ referralCode, locale }: Props) {
  const [copied, setCopied] = useState(false)

  const link = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}?ref=${referralCode}`
    : null

  async function copy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
      <h3 className="font-semibold text-sm mb-1">Пригласи друга</h3>
      <p className="text-xs text-brand-muted mb-4">
        Поделись ссылкой — друг получит −15 zł на первый заказ, и ты получишь −15 zł.
      </p>

      {link ? (
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-brand-border bg-brand-border/10 px-3 py-2">
            <p className="text-xs text-brand-muted truncate">{link}</p>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-2 text-xs font-medium transition hover:border-brand-accent"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-muted italic">Реферальный код генерируется…</p>
      )}
    </div>
  )
}
