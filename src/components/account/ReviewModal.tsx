'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import StarPicker from '@/components/shop/reviews/StarPicker'

export interface ReviewTarget {
  productId: string
  orderId:   string | null
  name:      string
}

interface Props {
  target:     ReviewTarget
  authorName: string
  email:      string
  onClose:    () => void
  onSubmitted: (productId: string, rating: number, text: string) => void
}

// Shared review form modal — used by the reviews section and the orders accordion.
export default function ReviewModal({ target, authorName, email, onClose, onSubmitted }: Props) {
  const t = useTranslations('dashboard')
  const [rating, setRating] = useState(0)
  const [text, setText]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating)                 { setErr(t('reviews_err_rating')); return }
    if (text.trim().length < 10) { setErr(t('reviews_err_text'));   return }
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId:  target.productId,
          orderId:    target.orderId,
          authorName: authorName || email.split('@')[0],
          email,
          rating,
          reviewText: text,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'error')
      }
      onSubmitted(target.productId, rating, text.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'error')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#3A2115]">{t('reviews_modal_title')}</h3>
        <p className="text-sm text-brand-muted">{target.name}</p>

        <div>
          <label className="mb-2 block text-xs font-medium text-brand-muted">{t('reviews_rating_label')}</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-brand-muted">{t('reviews_text_label')}</label>
          <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
            placeholder={t('reviews_text_placeholder')} className="input resize-none text-sm" />
        </div>

        {err && <p className="text-sm text-[#7A5A3A]">{err}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline text-sm">{t('reviews_close')}</button>
          <button type="submit" disabled={busy} className="btn btn-primary text-sm disabled:opacity-60">
            {busy ? t('reviews_submitting') : t('reviews_submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
