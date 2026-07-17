import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'

/**
 * Public order-confirmation lookup for the /success page.
 *
 * The buyer reaches /success?order=<uuid> right after paying and usually has NO
 * session yet (guest checkout, or a just-registered account still pending email
 * confirmation) — so the browser can no longer read shop_orders under RLS.
 *
 * This uses the service-role client (server-only) and returns ONLY the minimal
 * confirmation fields, looked up by the unguessable order UUID from the Stripe
 * success URL (a capability URL known only to the buyer). No address/items/PII
 * beyond the buyer's own name/email are returned.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createServiceSupabase()
  const { data, error } = await sb
    .from('shop_orders')
    .select('id,order_number,customer_email,customer_name,total,payment_status')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
