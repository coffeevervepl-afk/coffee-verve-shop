import { createServiceSupabase } from '@/lib/supabase/service'
import type { Locale } from '@/types/shop'

// ── Reviews section data ─────────────────────────────────────────────────────
// Products the customer received (delivered) but has not reviewed yet, plus the
// list of reviews they already left. Uses the service client so the "already
// reviewed" check sees pending/rejected rows too (RLS would hide non-approved).

export interface ReviewableProduct {
  productId: string
  orderId:   string
  name:      string
  image:     string | null
}

export interface MyReview {
  id:           string
  product_id:   string
  rating:       number
  review_text:  string
  status:       string
  created_at:   string
  product_name: string
  image:        string | null
}

const nameCol = (locale: Locale) =>
  locale === 'pl' ? 'name_pl' : locale === 'ua' ? 'name_ua' : 'name_ru'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function embed(sp: any) {
  return Array.isArray(sp) ? sp[0] : sp
}

export async function getReviewData(
  email: string,
  locale: Locale,
): Promise<{ toReview: ReviewableProduct[]; myReviews: MyReview[] }> {
  const sb  = createServiceSupabase()
  const col = nameCol(locale)
  const now = Date.now()
  // Delivered at least 3 days ago (time to try it) and at most 60 days ago.
  const from = new Date(now - 60 * 86_400_000).toISOString()
  const to   = new Date(now -  3 * 86_400_000).toISOString()

  const [ordersRes, reviewsRes] = await Promise.all([
    sb.from('shop_orders')
      .select('id, updated_at, shop_order_items(shop_product_id, shop_products(slug, images, name_ru, name_pl, name_ua))')
      .eq('customer_email', email)
      .eq('status', 'delivered')
      .gte('updated_at', from)
      .lte('updated_at', to)
      .order('updated_at', { ascending: false }),
    sb.from('shop_reviews')
      .select('id, product_id, rating, review_text, status, created_at, shop_products(images, name_ru, name_pl, name_ua)')
      .eq('author_email', email)
      .order('created_at', { ascending: false }),
  ])

  const reviews = (reviewsRes.data ?? []) as any[]
  const reviewedIds = new Set(reviews.map(r => r.product_id))

  const seen = new Set<string>()
  const toReview: ReviewableProduct[] = []
  for (const o of (ordersRes.data ?? []) as any[]) {
    for (const it of (o.shop_order_items ?? [])) {
      const pid = it.shop_product_id
      if (!pid || reviewedIds.has(pid) || seen.has(pid)) continue
      const p = embed(it.shop_products)
      if (!p) continue
      seen.add(pid)
      toReview.push({
        productId: pid,
        orderId:   o.id,
        name:      p[col] ?? p.name_ru ?? '—',
        image:     Array.isArray(p.images) ? (p.images[0] ?? null) : null,
      })
    }
  }

  const myReviews: MyReview[] = reviews.map(r => {
    const p = embed(r.shop_products)
    return {
      id:           r.id,
      product_id:   r.product_id,
      rating:       r.rating,
      review_text:  r.review_text,
      status:       r.status,
      created_at:   r.created_at,
      product_name: p?.[col] ?? p?.name_ru ?? '—',
      image:        p && Array.isArray(p.images) ? (p.images[0] ?? null) : null,
    }
  })

  return { toReview, myReviews }
}

// ── Referral stats ───────────────────────────────────────────────────────────

export interface ReferralStats { invited: number; available: number }

export async function getReferralStats(authUid: string): Promise<ReferralStats> {
  const sb = createServiceSupabase()
  const { data } = await sb.from('referral_bonuses').select('status').eq('user_id', authUid)
  const rows = (data ?? []) as any[]
  return {
    invited:   rows.length,
    available: rows.filter(r => r.status === 'available').length,
  }
}
