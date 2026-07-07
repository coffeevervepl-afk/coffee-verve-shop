import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { data: order, error: orderError } = await sb
    .from('shop_orders')
    .select('id,order_number,status,payment_status,created_at,delivery_type,tracking_number,delivery_address,subtotal,discount_pct,discount_amount,delivery_cost,total,customer_name,customer_email,customer_phone,customer_telegram,payment_provider,shop_order_items(id,product_name,weight,quantity,unit_price,line_total))')
    .eq('id', params.id)
    .eq('shop_user_id', shopUser.id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
