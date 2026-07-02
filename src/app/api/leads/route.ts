import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

function randomCode(prefix: string, len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s}`
}

export async function POST(req: NextRequest) {
  const { email, source = 'website_form' } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const sb = await createServerSupabase()

  // Check if already a lead (idempotent)
  const { data: existing } = await sb
    .from('leads')
    .select('id, promo_code_id, shop_promo_codes(code)')
    .eq('email', email)
    .limit(1)
    .single()

  if (existing) {
    const existingCode = (existing as any).shop_promo_codes?.code ?? null
    return NextResponse.json({ ok: true, code: existingCode, already: true })
  }

  // Generate unique welcome promo code
  let promoCode: string
  let attempts = 0
  while (true) {
    promoCode = randomCode('WELCOME', 6)
    const { count } = await sb
      .from('shop_promo_codes')
      .select('id', { count: 'exact', head: true })
      .eq('code', promoCode)
    if ((count ?? 0) === 0) break
    if (++attempts > 10) { promoCode = randomCode('WEL', 8); break }
  }

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: promo, error: promoError } = await sb
    .from('shop_promo_codes')
    .insert({
      code:             promoCode!,
      type:             'percent',
      value:            10,
      min_order:        0,
      valid_until:      validUntil,
      one_per_customer: true,
      category:         'welcome',
      is_active:        true,
    })
    .select('id, code')
    .single()

  if (promoError || !promo) {
    console.error('Promo create error:', promoError)
    return NextResponse.json({ error: 'promo_create_failed' }, { status: 500 })
  }

  // Save lead
  await sb.from('leads').insert({ email, source, promo_code_id: promo.id })

  // Notify N8N (optional, fire-and-forget)
  const n8nUrl = process.env.N8N_ORDER_WEBHOOK_URL?.replace('/shop-order', '/lead-created')
  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '' },
      body: JSON.stringify({ event: 'lead_created', email, promo_code: promo.code, valid_until: validUntil }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, code: promo.code, valid_until: validUntil })
}
