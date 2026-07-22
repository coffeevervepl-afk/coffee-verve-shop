'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import StarPicker from '@/components/shop/reviews/StarPicker'
import type { ReviewableProduct, MyReview } from '@/lib/account/dashboard'

interface Props {
  toReview:   ReviewableProduct[]
  myReviews:  MyReview[]
  authorName: string
  email:      string
}

export default function ReviewsSection({ toReview, myReviews, authorName, email }: Props) {
  const t = useTranslations('dashboard')
  const [pending, setPending]   = useState<ReviewableProduct[]>(toReview)
  const [mine, setMine]         = useState<MyReview[]>(myReviews)
  const [active, setActive]     = useState<ReviewableProduct | null>(null)
  const [thanks, setThanks]     = useState(false)
  const [showMine, setShowMine] = useState(false)

  // Section is hidden entirely when there is nothing to review and no history.
  if (pending.length === 0 && mine.length === 0) return null

  function onSubmitted(p: ReviewableProduct, rating: number, text: string) {
    setPending(prev => prev.filter(x => x.productId !== p.productId))
    setMine(prev => [{
      id: `tmp-${p.productId}`, product_id: p.productId, rating, review_text: text,
      status: 'pending', created_at: new Date().toISOString(), product_name: p.name, image: p.image,
    }, ...prev])
    setActive(null)
    setThanks(true)
  }

  return (
    <section>
      {pending.length > 0 && (
        <>
          <h2 className="text-[18px] font-bold text-[#3A2115]">{t('reviews_title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('reviews_subtitle')}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {pending.map(p => (
              <div key={p.productId} className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  {p.image && <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#3A2115]">{p.name}</p>
                  <button type="button" onClick={() => setActive(p)} className="mt-0.5 text-xs font-semibold text-[#412618] hover:underline">
                    {t('reviews_write')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {mine.length > 0 && (
        <div className={pending.length > 0 ? 'mt-4' : ''}>
          <button type="button" onClick={() => setShowMine(v => !v)} className="text-sm font-medium text-[#412618] underline underline-offset-2">
            {t('reviews_my', { n: mine.length })} {showMine ? '▴' : '▾'}
          </button>
          {showMine && (
            <ul className="mt-3 space-y-2">
              {mine.map(r => (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[#3A2115]">{r.product_name}</span>
                    <span className="shrink-0 text-xs text-amber-500">{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span></span>
                  </div>
                  {r.review_text && <p className="mt-1 line-clamp-3 text-xs text-gray-600">{r.review_text}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{t(`reviews_status_${r.status}`)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {active && (
        <ReviewModal
          product={active}
          authorName={authorName}
          email={email}
          onClose={() => setActive(null)}
          onSubmitted={onSubmitted}
        />
      )}

      {thanks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setThanks(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold text-[#412618]">{t('reviews_thanks_title')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('reviews_thanks_body')}</p>
            <button type="button" onClick={() => setThanks(false)} className="mt-6 rounded-full bg-[#412618] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810]">
              {t('reviews_close')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function ReviewModal({
  product, authorName, email, onClose, onSubmitted,
}: {
  product: ReviewableProduct
  authorName: string
  email: string
  onClose: () => void
  onSubmitted: (p: ReviewableProduct, rating: number, text: string) => void
}) {
  const t = useTranslations('dashboard')
  const [rating, setRating] = useState(0)
  const [text, setText]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating)               { setErr(t('reviews_err_rating')); return }
    if (text.trim().length < 10) { setErr(t('reviews_err_text'));  return }
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.productId,
          orderId:   product.orderId,
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
      onSubmitted(product, rating, text.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'error')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#3A2115]">{t('reviews_modal_title')}</h3>
        <p className="text-sm text-brand-muted">{product.name}</p>

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
