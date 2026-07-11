import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, name, phone, language, orderId } = await req.json()

  if (!email || !password || password.length < 6 || !name) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  const sb = await createServerSupabase()

  // Check if shop_user already registered
  const { data: existing } = await sb
    .from('shop_users')
    .select('id, is_guest, referral_code, min_discount_until')
    .eq('email', email)
    .single()

  let shopUserId = existing?.id ?? null

  // If no shop_user, create one (rare — normally created at checkout)
  if (!shopUserId) {
    const { data: newUser } = await sb
      .from('shop_users')
      .insert({
        email,
        name,
        phone: phone ?? null,
        language: language ?? 'ru',
        is_guest: false,
        discount_pct: 5,
        loyalty_level: 'classic',
      })
      .select('id')
      .single()
    shopUserId = newUser?.id
  } else {
    // Convert guest → registered; set min_discount_until = +6 months if not already active
    const sixMonthsFromNow = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
    const currentMin = existing?.min_discount_until
    const needsMin   = !currentMin || new Date(currentMin) < new Date()
    await sb
      .from('shop_users')
      .update({
        name:               name || undefined,
        phone:              phone ?? undefined,
        language:           language ?? undefined,
        is_guest:           false,
        ...(needsMin ? { min_discount_until: sixMonthsFromNow } : {}),
      })
      .eq('id', shopUserId)
  }

  // Generate referral code if missing
  if (existing && !existing.referral_code && shopUserId) {
    const { data: codeData } = await sb.rpc('generate_referral_code')
    if (codeData) {
      await sb.from('shop_users')
        .update({ referral_code: codeData })
        .eq('id', shopUserId)
    }
  }

  // Create the Supabase Auth user via the standard signUp flow, so Supabase
  // sends the confirmation email through SMTP instead of auto-confirming.
  const { data: authData, error: authError } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name, shop_user_id: shopUserId } },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return NextResponse.json({ ok: true, already_exists: true })
    }
    console.error('Auth signUp error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Run loyalty recalc
  if (shopUserId) await sb.rpc('recalc_loyalty', { p_user_id: shopUserId })

  return NextResponse.json({ ok: true, authId: authData.user?.id, shopUserId, needsEmailConfirmation: true })
}
