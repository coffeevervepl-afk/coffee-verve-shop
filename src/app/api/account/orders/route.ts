import { NextResponse } from 'next/server'
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
    return NextResponse.json({ orders: [] })
  }

  const { data: orders } = await sb
    .from('shop_orders')
    .select('id,order_number,total,status,created_at,tracking_number')
    .eq('shop_user_id', shopUser.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
}
