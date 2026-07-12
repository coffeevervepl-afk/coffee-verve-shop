import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const sb = await createServerSupabase()
  const { data: authData, error: authError } = await sb.auth.getUser()
  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { data: shopUser, error: userError } = await sb
    .from('shop_users')
    .select('id')
    .eq('email', authData.user.email)
    .single()

  if (userError || !shopUser) {
    return NextResponse.json({ addresses: [] })
  }

  const { data: addresses } = await sb
    .from('shop_addresses')
    .select('*')
    .eq('shop_user_id', shopUser.id)
    .order('is_default', { ascending: false })

  return NextResponse.json({ addresses: addresses ?? [] })
}

export async function POST(req: NextRequest) {
  const sb = await createServerSupabase()
  const { data: authData, error: authError } = await sb.auth.getUser()
  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { data: shopUser, error: userError } = await sb
    .from('shop_users')
    .select('id')
    .eq('email', authData.user.email)
    .single()

  if (userError || !shopUser) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { count } = await sb
    .from('shop_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('shop_user_id', shopUser.id)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'max_addresses_reached' }, { status: 400 })
  }

  const payload = await req.json()
  const {
    type,
    street,
    city,
    postal_code,
    country,
    paczkomat_id,
    paczkomat_name,
    paczkomat_address,
    is_default,
    label,
    recipient_name,
    recipient_phone,
  } = payload

  const insertData = {
    shop_user_id: shopUser.id,
    type,
    street: street ?? null,
    city: city ?? null,
    postal_code: postal_code ?? null,
    country: country ?? null,
    paczkomat_id: paczkomat_id ?? null,
    paczkomat_name: paczkomat_name ?? null,
    paczkomat_address: paczkomat_address ?? null,
    is_default: Boolean(is_default),
    label: label ?? null,
    recipient_name: recipient_name ?? null,
    recipient_phone: recipient_phone ?? null,
  }

  if (insertData.is_default) {
    await sb.from('shop_addresses').update({ is_default: false }).eq('shop_user_id', shopUser.id)
  }

  const { error } = await sb.from('shop_addresses').insert(insertData)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const sb = await createServerSupabase()
  const { data: authData, error: authError } = await sb.auth.getUser()
  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { data: shopUser, error: userError } = await sb
    .from('shop_users')
    .select('id')
    .eq('email', authData.user.email)
    .single()

  if (userError || !shopUser) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const payload = await req.json()
  const {
    id,
    type,
    street,
    city,
    postal_code,
    country,
    paczkomat_id,
    paczkomat_name,
    paczkomat_address,
    is_default,
    label,
    recipient_name,
    recipient_phone,
  } = payload

  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 })

  if (is_default) {
    await sb.from('shop_addresses').update({ is_default: false }).eq('shop_user_id', shopUser.id)
  }

  const { error } = await sb
    .from('shop_addresses')
    .update({
      type,
      street: street ?? null,
      city: city ?? null,
      postal_code: postal_code ?? null,
      country: country ?? null,
      paczkomat_id: paczkomat_id ?? null,
      paczkomat_name: paczkomat_name ?? null,
      paczkomat_address: paczkomat_address ?? null,
      is_default: Boolean(is_default),
      label: label ?? null,
      recipient_name: recipient_name ?? null,
      recipient_phone: recipient_phone ?? null,
    })
    .eq('id', id)
    .eq('shop_user_id', shopUser.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const sb = await createServerSupabase()
  const { data: authData, error: authError } = await sb.auth.getUser()
  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { data: shopUser, error: userError } = await sb
    .from('shop_users')
    .select('id')
    .eq('email', authData.user.email)
    .single()

  if (userError || !shopUser) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 })

  const { error } = await sb
    .from('shop_addresses')
    .delete()
    .eq('id', id)
    .eq('shop_user_id', shopUser.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
