import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const {
    email, password, name, phone, language, orderId,
    consent_terms, consent_email_marketing, consent_sms_marketing,
  } = await req.json()

  if (!email || !password || password.length < 6 || !name) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  // Only set consent columns when the caller actually sent them, so callers
  // that don't collect consent (checkout upsell, payment webhook) neither
  // fail nor overwrite an existing user's previously recorded consent.
  const now = new Date().toISOString()
  const consentFields = {
    ...(consent_terms !== undefined
      ? { consent_terms: !!consent_terms, consent_terms_at: consent_terms ? now : null }
      : {}),
    ...(consent_email_marketing !== undefined
      ? { consent_email_marketing: !!consent_email_marketing, consent_email_marketing_at: consent_email_marketing ? now : null }
      : {}),
    ...(consent_sms_marketing !== undefined
      ? { consent_sms_marketing: !!consent_sms_marketing, consent_sms_marketing_at: consent_sms_marketing ? now : null }
      : {}),
  }

  // Service-role for DB ops: this route runs BEFORE the user has a session
  // (signUp happens below), so shop_users SELECT/UPDATE would be blocked by the
  // locked-down RLS. recalc_loyalty is SECURITY INVOKER, so its internal UPDATE
  // must run privileged too. auth.signUp itself uses the standard SSR client
  // (sbAuth) to preserve the email-confirmation flow.
  const sb = createServiceSupabase()

  // Check if shop_user already registered
  const { data: existing } = await sb
    .from('shop_users')
    .select('id, is_guest, referral_code, min_discount_until')
    .eq('email', email)
    .single()

  let shopUserId = existing?.id ?? null

  // If no shop_user, create one (rare — normally created at checkout).
  // This MUST succeed before we create the Supabase Auth user below —
  // otherwise a failed insert (e.g. a CRM-sync trigger rejecting the row)
  // would leave an orphaned auth.users record with no matching shop_users
  // row. Check the error explicitly instead of letting it pass silently.
  if (!shopUserId) {
    const { data: newUser, error: insertError } = await sb
      .from('shop_users')
      .insert({
        email,
        name,
        phone: phone ?? null,
        language: language ?? 'ru',
        is_guest: false,
        discount_pct: 5,
        loyalty_level: 'classic',
        ...consentFields,
      })
      .select('id')
      .single()
    if (insertError || !newUser) {
      console.error('Registration: shop_users insert failed:', insertError)
      return NextResponse.json({ error: 'shop_user_create_failed' }, { status: 500 })
    }
    shopUserId = newUser.id
  } else {
    // Convert guest → registered; set min_discount_until = +6 months if not already active
    const sixMonthsFromNow = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
    const currentMin = existing?.min_discount_until
    const needsMin   = !currentMin || new Date(currentMin) < new Date()
    const { error: updateError } = await sb
      .from('shop_users')
      .update({
        name:               name || undefined,
        phone:              phone ?? undefined,
        language:           language ?? undefined,
        is_guest:           false,
        ...(needsMin ? { min_discount_until: sixMonthsFromNow } : {}),
        ...consentFields,
      })
      .eq('id', shopUserId)
    if (updateError) {
      console.error('Registration: shop_users update failed:', updateError)
      return NextResponse.json({ error: 'shop_user_update_failed' }, { status: 500 })
    }
  }

  // Generate referral code if missing (non-critical enrichment — log but
  // don't fail registration if it doesn't stick).
  if (existing && !existing.referral_code && shopUserId) {
    const { data: codeData } = await sb.rpc('generate_referral_code')
    if (codeData) {
      const { error: refError } = await sb.from('shop_users')
        .update({ referral_code: codeData })
        .eq('id', shopUserId)
      if (refError) console.error('Registration: referral_code update failed:', refError)
    }
  }

  // Create the Supabase Auth user via the standard signUp flow, so Supabase
  // sends the confirmation email through SMTP instead of auto-confirming.
  const sbAuth = await createServerSupabase()
  const { data: authData, error: authError } = await sbAuth.auth.signUp({
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

  // Primary, reliable link shop_users -> auth.users. Kept IN ADDITION to the
  // existing user_metadata.shop_user_id + email matching (nothing removed).
  // Non-critical: log but don't fail registration if the link doesn't stick.
  if (authData.user?.id && shopUserId) {
    const { error: linkError } = await sb
      .from('shop_users')
      .update({ auth_user_id: authData.user.id })
      .eq('id', shopUserId)
    if (linkError) console.error('Registration: auth_user_id link failed:', linkError)
  }

  // Run loyalty recalc
  if (shopUserId) await sb.rpc('recalc_loyalty', { p_user_id: shopUserId })

  return NextResponse.json({ ok: true, authId: authData.user?.id, shopUserId, needsEmailConfirmation: true })
}
