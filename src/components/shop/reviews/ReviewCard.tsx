import type { ShopReview } from '@/lib/supabase/reviews'
import StarDisplay from './StarDisplay'

interface Props { review: ShopReview }

export default function ReviewCard({ review }: Props) {
  const date = new Date(review.created_at).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <article className="border-b border-brand-border py-5 last:border-0">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
            {review.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{review.author_name}</p>
            <p className="text-xs text-brand-muted">{date}</p>
          </div>
        </div>
        <StarDisplay rating={review.rating} size="sm" />
      </div>

      {/* Review text */}
      <p className="text-sm leading-relaxed text-brand-muted">{review.review_text}</p>

      {/* Moderator response */}
      {review.moderator_response && (
        <div className="mt-3 rounded-xl bg-sky-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-sky-700">Ответ продавца</p>
          <p className="text-sm leading-relaxed text-sky-900">{review.moderator_response}</p>
        </div>
      )}
    </article>
  )
}
