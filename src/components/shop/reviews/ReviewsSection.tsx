import { getApprovedReviews, getProductRating, hasBoughtProduct, hasReviewedProduct } from '@/lib/supabase/reviews'
import type { Locale } from '@/types/shop'
import StarDisplay from './StarDisplay'
import ReviewCard from './ReviewCard'
import ReviewFormWrapper from './ReviewFormWrapper'

interface Props {
  productId: string
  locale:    Locale
  // email comes from searchParams (?email=…) — optional, lightweight session approach
  email?:    string
}

const PER_PAGE = 10

export default async function ReviewsSection({ productId, locale, email }: Props) {
  const [rating, { reviews, total }] = await Promise.all([
    getProductRating(productId),
    getApprovedReviews(productId, 1, PER_PAGE),
  ])

  // Check buyer eligibility
  let canReview = false
  let orderId:  string | null = null
  let alreadyReviewed = false

  if (email) {
    const [buyerCheck, reviewedCheck] = await Promise.all([
      hasBoughtProduct(email, productId),
      hasReviewedProduct(email, productId),
    ])
    canReview       = buyerCheck.hasBought && !reviewedCheck
    orderId         = buyerCheck.orderId
    alreadyReviewed = reviewedCheck
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <section className="mt-16 border-t border-brand-border pt-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-4">
        <h2 className="text-xl font-semibold">Отзывы</h2>
        {rating.review_count > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay rating={rating.avg_rating} size="md" showNum />
            <span className="text-sm text-brand-muted">{rating.review_count} отзывов</span>
          </div>
        )}
        {rating.review_count === 0 && (
          <span className="text-sm text-brand-muted">Пока нет отзывов</span>
        )}
      </div>

      {/* ── Review Form ─────────────────────────────────────────────────── */}
      <div className="mb-10">
        {!email ? (
          <p className="text-sm text-brand-muted">
            Только покупатели могут оставлять отзывы на этот товар
          </p>
        ) : alreadyReviewed ? (
          <p className="text-sm text-brand-muted">Вы уже оставили отзыв на этот товар — спасибо!</p>
        ) : canReview ? (
          <ReviewFormWrapper productId={productId} orderId={orderId} email={email} />
        ) : (
          <p className="text-sm text-brand-muted">
            Только покупатели могут оставлять отзывы на этот товар
          </p>
        )}
      </div>

      {/* ── Reviews list ────────────────────────────────────────────────── */}
      {reviews.length > 0 ? (
        <div>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}

          {totalPages > 1 && (
            <p className="mt-6 text-center text-sm text-brand-muted">
              Показано {reviews.length} из {total} отзывов
              {/* Full pagination component can be added in Week 2 */}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-brand-muted">Будьте первым, кто оставит отзыв!</p>
      )}
    </section>
  )
}
