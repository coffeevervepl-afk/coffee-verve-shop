import { createServerSupabase } from './server'

export interface ShopReview {
  id:                 string
  product_id:         string
  order_id:           string | null
  author_name:        string
  author_email:       string | null
  rating:             number
  review_text:        string
  image_urls:         string[] | null
  city:               string | null
  moderator_response: string | null
  status:             'pending' | 'approved' | 'rejected'
  created_at:         string
  updated_at:         string
  avatar_url?:        string | null   // joined from shop_users by author_email
}

export interface ProductRating {
  review_count: number
  avg_rating:   number
}

// ── Public read ─────────────────────────────────────────────────────────────

export async function getApprovedReviews(
  productId: string,
  page = 1,
  perPage = 10,
): Promise<{ reviews: ShopReview[]; total: number }> {
  const sb    = await createServerSupabase()
  const from  = (page - 1) * perPage
  const to    = from + perPage - 1

  const { data, count, error } = await sb
    .from('shop_reviews')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  const reviews = (data ?? []) as ShopReview[]

  // Attach each author's avatar (shop_reviews has no FK to shop_users → look up by email).
  const emails = [...new Set(reviews.map(r => r.author_email).filter((e): e is string => !!e))]
  if (emails.length) {
    const { data: users } = await sb.from('shop_users').select('email, avatar_url').in('email', emails)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map((users ?? []).map((u: any) => [u.email, u.avatar_url as string | null]))
    reviews.forEach(r => { r.avatar_url = r.author_email ? map.get(r.author_email) ?? null : null })
  }
  return { reviews, total: count ?? 0 }
}

export async function getProductRating(productId: string): Promise<ProductRating> {
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('shop_product_rating')
    .select('review_count, avg_rating')
    .eq('product_id', productId)
    .single()
  return data ?? { review_count: 0, avg_rating: 0 }
}

// ── Buyer verification ──────────────────────────────────────────────────────

export async function hasBoughtProduct(
  email: string,
  productId: string,
): Promise<{ hasBought: boolean; orderId: string | null }> {
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('shop_orders')
    .select('id, shop_order_items!inner(shop_product_id)')
    .eq('customer_email', email)
    .eq('payment_status', 'paid')
    .eq('shop_order_items.shop_product_id', productId)
    .limit(1)
    .single()

  return { hasBought: !!data, orderId: data?.id ?? null }
}

// Already left a review?
export async function hasReviewedProduct(
  email: string,
  productId: string,
): Promise<boolean> {
  const sb = await createServerSupabase()
  const { count } = await sb
    .from('shop_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('author_email', email)
  return (count ?? 0) > 0
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function getAllReviews(
  status?: 'pending' | 'approved' | 'rejected',
  page = 1,
  perPage = 20,
): Promise<{ reviews: (ShopReview & { product_name: string })[]; total: number }> {
  const sb   = await createServerSupabase()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = sb
    .from('shop_reviews')
    .select('*, shop_products(name_ru)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) throw error

  const reviews = (data ?? []).map((r: any) => ({
    ...r,
    product_name: r.shop_products?.name_ru ?? '—',
  }))

  return { reviews, total: count ?? 0 }
}

export async function moderateReview(
  reviewId: string,
  action: 'approved' | 'rejected',
  moderatorResponse?: string,
): Promise<void> {
  const sb = await createServerSupabase()
  await sb
    .from('shop_reviews')
    .update({
      status:             action,
      moderator_response: moderatorResponse ?? null,
      updated_at:         new Date().toISOString(),
    })
    .eq('id', reviewId)
}
