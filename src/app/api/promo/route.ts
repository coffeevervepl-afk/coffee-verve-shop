import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { code, email = '', orderAmount = 0 } = await req.json()

  if (!code?.trim()) {
    return NextResponse.json({ valid: false, error: 'empty_code' }, { status: 400 })
  }

  const sb = await createServerSupabase()

  // Call the security-definer SQL function
  const { data, error } = await sb.rpc('validate_promo_code', {
    p_code:      code.trim().toUpperCase(),
    p_email:     email,
    p_order_amt: Number(orderAmount),
  })

  if (error) {
    console.error('Promo validate error:', error)
    return NextResponse.json({ valid: false, error: 'server_error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
