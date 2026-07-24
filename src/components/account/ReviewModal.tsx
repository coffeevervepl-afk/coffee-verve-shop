'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import StarPicker from '@/components/shop/reviews/StarPicker'
import ReviewPhotoInput from '@/components/shop/reviews/ReviewPhotoInput'
import { uploadReviewPhotos } from '@/lib/supabase/uploads'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/account/Modal'

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
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating)                 { setErr(t('reviews_err_rating')); return }
    if (text.trim().length < 10) { setErr(t('reviews_err_text'));   return }
    setErr('')
    setBusy(true)
    try {
      // Photos need an active Supabase session (RLS: own folder). If it expired,
      // stop and tell the user — don't silently drop their photos. Text is kept.
      let imageUrls: string[] = []
      if (photos.length) {
        const { data: { session } } = await createClient().auth.getSession()
        if (!session) { setErr(t('reviews_session_expired')); setBusy(false); return }
        imageUrls = await uploadReviewPhotos(photos)
      }
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
          imageUrls,
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
    <Modal
      title={t('reviews_modal_title')}
      subtitle={target.name}
      onClose={onClose}
      closeLabel={t('reviews_close')}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button type="button" onClick={onClose} className="order-2 w-full rounded-full px-5 py-2.5 text-sm font-normal text-gray-500 hover:text-gray-700 sm:order-1 sm:w-auto">{t('reviews_close')}</button>
          <button type="submit" form="review-form" disabled={busy} className="order-1 w-full rounded-full bg-[#412618] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-60 sm:order-2 sm:w-auto">
            {busy ? t('reviews_submitting') : t('reviews_submit')}
          </button>
        </div>
      }
    >
      <form id="review-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-brand-muted">{t('reviews_rating_label')}</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-brand-muted">{t('reviews_text_label')}</label>
          <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
            placeholder={t('reviews_text_placeholder')} className="input resize-none text-sm" />
        </div>
        <ReviewPhotoInput files={photos} onChange={setPhotos} label={t('reviews_photos_label')} />
        {err && <p className="text-sm text-[#7A5A3A]">{err}</p>}
      </form>
    </Modal>
  )
}
