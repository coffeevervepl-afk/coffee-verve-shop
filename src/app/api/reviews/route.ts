import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { hasBoughtProduct, hasReviewedProduct } from '@/lib/supabase/reviews'

export async function POST(req: NextRequest) {
  const { productId, orderId, authorName, email, rating, reviewText } = await req.json()

  if (!productId || !authorName || !rating || !reviewText) {
    return NextResponse.json({ error: 'Обязательные поля отсутствуют' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Рейтинг должен быть от 1 до 5' }, { status: 400 })
  }
  if (reviewText.trim().length < 10) {
    return NextResponse.json({ error: 'Текст отзыва слишком короткий' }, { status: 400 })
  }

  // Verify buyer (if email provided)
  if (email) {
    const { hasBought } = await hasBoughtProduct(email, productId)
    if (!hasBought) {
      return NextResponse.json({ error: 'Только покупатели могут оставлять отзывы' }, { status: 403 })
    }
    const already = await hasReviewedProduct(email, productId)
    if (already) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв на этот товар' }, { status: 409 })
    }
  }

  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('shop_reviews')
    .insert({
      product_id:  productId,
      order_id:    orderId ?? null,
      author_name: authorName.trim(),
      author_email: email ?? null,
      rating:      Number(rating),
      review_text: reviewText.trim(),
      status:      'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Review insert error:', error)
    return NextResponse.json({ error: 'Ошибка при сохранении' }, { status: 500 })
  }

  // Optional: notify N8N / admin
  try {
    if (process.env.N8N_ORDER_WEBHOOK_URL) {
      await fetch(process.env.N8N_ORDER_WEBHOOK_URL.replace('/shop-order', '/new-review'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({
          event: 'review.pending',
          reviewId: data.id,
          productId,
          authorName,
          rating,
          reviewText: reviewText.trim().slice(0, 200),
        }),
      })
    }
  } catch { /* N8N is optional */ }

  return NextResponse.json({ ok: true, reviewId: data.id })
}

// Admin: update review status
export async function PATCH(req: NextRequest) {
  const { reviewId, status, moderatorResponse } = await req.json()

  if (!reviewId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const sb = await createServerSupabase()
  await sb
    .from('shop_reviews')
    .update({ status, moderator_response: moderatorResponse ?? null, updated_at: new Date().toISOString() })
    .eq('id', reviewId)

  return NextResponse.json({ ok: true })
}
