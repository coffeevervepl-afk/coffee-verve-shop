import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { createServerSupabase } from '@/lib/supabase/server'

// Bonus-pack catalog (250g free packs) + the caller's available accumulated bonuses.
export async function GET(req: NextRequest) {
  const locale = new URL(req.url).searchParams.get('locale') ?? 'ru'
  const col = locale === 'pl' ? 'name_pl' : locale === 'ua' ? 'name_ua' : 'name_ru'

  const svc = createServiceSupabase()
  const { data: products } = await svc
    .from('shop_products')
    .select('id, name_ru, name_pl, name_ua, images')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (products ?? []).map((p: any) => ({
    id:    p.id,
    name:  p[col] || p.name_ru,
    image: Array.isArray(p.images) ? (p.images[0] ?? null) : null,
  }))

  let availableBonuses = 0
  try {
    const ssb = await createServerSupabase()
    const { data: { user } } = await ssb.auth.getUser()
    if (user) {
      const { count } = await ssb
        .from('referral_bonuses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'available')
      availableBonuses = count ?? 0
    }
  } catch { /* anonymous checkout — no bonuses */ }

  return NextResponse.json({ products: list, availableBonuses })
}
