import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { normalizeTelegramUsername } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'no_email' }, { status: 400 })

  const sb = await createServerSupabase()
  const [userRes, configRes, ordersRes] = await Promise.all([
    sb.from('shop_users')
      .select('id,email,name,telegram,loyalty_level,spent_12m,referral_code,taste_profile,birthday,is_b2b,b2b_discount,level_updated_at')
      .eq('email', email)
      .single(),
    sb.from('loyalty_config').select('key,value'),
    sb.from('shop_orders')
      .select('id,order_number,total,status,payment_status,created_at,shop_order_items(product_name,weight,quantity)')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const config: Record<string, number> = {}
  for (const r of configRes.data ?? []) config[r.key] = Number(r.value)

  return NextResponse.json({
    user:   userRes.data,
    config,
    orders: ordersRes.data ?? [],
  })
}

export async function PATCH(req: NextRequest) {
  const { email, taste_profile, birthday, name, telegram } = await req.json()
  if (!email) return NextResponse.json({ error: 'no_email' }, { status: 400 })

  const sb = await createServerSupabase()
  const update: Record<string, unknown> = {}
  if (taste_profile !== undefined) update.taste_profile = taste_profile
  if (birthday      !== undefined) update.birthday      = birthday || null
  if (name          !== undefined) update.name          = name
  if (telegram      !== undefined) update.telegram      = normalizeTelegramUsername(telegram) ?? null

  const { error } = await sb.from('shop_users').update(update).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
