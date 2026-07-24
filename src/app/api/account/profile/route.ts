import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (body.name !== undefined)                    update.name = body.name || null
  if (body.phone !== undefined)                    update.phone = body.phone || null
  if (body.avatar_url !== undefined)               update.avatar_url = body.avatar_url || null
  if (body.consent_email_marketing !== undefined)  update.consent_email_marketing = !!body.consent_email_marketing
  if (body.consent_sms_marketing !== undefined)    update.consent_sms_marketing = !!body.consent_sms_marketing

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no_fields' }, { status: 400 })
  }

  // Select the updated rows back so a 0-row update (e.g. an RLS policy filtering
  // everything out, or an email that matches no shop_users row) is treated as a
  // failure instead of a silent success — PostgREST returns no error in that case.
  const { data: updated, error } = await supabase
    .from('shop_users')
    .update(update)
    .eq('email', user.email)
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'not_updated' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
