'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import StarPicker from './StarPicker'
import ReviewPhotoInput from './ReviewPhotoInput'
import { uploadReviewPhotos } from '@/lib/supabase/uploads'

interface Props {
  productId: string
  orderId:   string | null
  email:     string   // from URL param / session storage
  onSuccess: () => void
}

export default function ReviewForm({ productId, orderId, email, onSuccess }: Props) {
  const [name,   setName]   = useState('')
  const [rating, setRating] = useState(0)
  const [text,   setText]   = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [busy,   setBusy]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { toast.error('Выберите рейтинг (звёзды)'); return }
    if (text.trim().length < 10) { toast.error('Напишите хотя бы 10 символов'); return }

    setBusy(true)
    try {
      const imageUrls = photos.length ? await uploadReviewPhotos(photos) : []
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, authorName: name, email, rating, reviewText: text, imageUrls }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Ошибка')
      }
      toast.success('Отзыв отправлен — появится после проверки')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
      <h3 className="text-sm font-semibold">Оставить отзыв</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-muted">Ваше имя</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Имя или псевдоним"
          className="input text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-brand-muted">Рейтинг</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-muted">Отзыв</label>
        <textarea
          required
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Расскажите о вкусе, аромате, впечатлениях…"
          className="input resize-none text-sm"
        />
      </div>

      <ReviewPhotoInput files={photos} onChange={setPhotos} />

      <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
        {busy ? 'Отправляю…' : 'Отправить отзыв'}
      </button>

      <p className="text-center text-xs text-brand-muted">
        Отзыв появится после проверки модератором
      </p>
    </form>
  )
}
