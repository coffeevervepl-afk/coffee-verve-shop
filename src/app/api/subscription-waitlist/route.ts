import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'

// Stores emails of people who want the coffee subscription once it launches.
// Backend for the subscription itself is Phase 2 — this is just the waitlist.
export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const locale = (body.locale ?? '').slice(0, 8) || null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const sb = createServiceSupabase()
  const { error } = await sb.from('subscription_waitlist').insert({ email, locale })
  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
