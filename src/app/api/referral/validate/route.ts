import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { validateReferral } from '@/lib/referral'

export async function POST(req: NextRequest) {
  const { code, email, subtotal } = await req.json()
  if (!code) return NextResponse.json({ valid: false, reason: 'not_found' })
  const sb = createServiceSupabase()
  const result = await validateReferral(sb, String(code), String(email ?? ''), Number(subtotal ?? 0))
  return NextResponse.json(result)
}
