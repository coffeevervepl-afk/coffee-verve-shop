'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function LeadCaptureBlock() {
  const t = useTranslations('lead')
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [copied,    setCopied]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'error')
      setPromoCode(data.code)
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    if (!promoCode) return
    await navigator.clipboard.writeText(promoCode)
    setCopied(true)
    toast.success(t('copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  // After code is revealed
  if (promoCode) {
    return (
      <section className="bg-brand-accent text-white rounded-3xl px-6 py-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-70 mb-2">{t('title')}</p>
        <p className="text-4xl font-bold tracking-widest mb-3">{promoCode}</p>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/30 transition mb-4"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t('copied') : t('copy')}
        </button>
        <p className="text-sm opacity-75">{t('check_email', { email })}</p>
        <p className="text-xs opacity-50 mt-1">{t('valid_days')}</p>
      </section>
    )
  }

  return (
    <section className="bg-brand-accent text-white rounded-3xl px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-2xl font-bold mb-1">{t('headline')}</p>
          <p className="text-sm opacity-75">{t('subline')}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto md:min-w-[340px]">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full rounded-full bg-white/15 pl-9 pr-4 py-3 text-sm placeholder:opacity-60 outline-none focus:bg-white/25 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex-shrink-0 rounded-full bg-white text-brand-accent px-5 py-3 text-sm font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? '…' : <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </section>
  )
}
