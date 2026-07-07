import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ exists: false, discount_pct: 0, loyalty_level: 'classic' })
  }

  const sb = await createServerSupabase()
  const { data } = await sb
    .from('shop_users')
    .select('discount_pct, loyalty_level')
    .eq('email', email)
    .eq('is_guest', false)
    .maybeSingle()

  return NextResponse.json({
    exists: !!data,
    discount_pct: Number(data?.discount_pct ?? 0),
    loyalty_level: data?.loyalty_level ?? 'classic',
  })
}
