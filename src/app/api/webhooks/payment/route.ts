import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payment'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
               ?? req.headers.get('x-signature')
               ?? ''

  try {
    const provider = getPaymentProvider()
    const result   = await provider.verifyWebhook(Buffer.from(body), signature)

    if (!result.orderId) return NextResponse.json({ ok: true })

    const sb = await createServerSupabase()

    // Update payment status
    if (result.status === 'paid') {
      await sb
        .from('shop_orders')
        .update({ payment_status: 'paid', status: 'processing', payment_ref: result.paymentRef })
        .eq('id', result.orderId)

      // Notify N8N
      const order = await sb.from('shop_orders').select('*').eq('id', result.orderId).single()
      if (order.data && !order.data.n8n_notified) {
        try {
          await fetch(process.env.N8N_ORDER_WEBHOOK_URL!, {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
            },
            body: JSON.stringify({
              event:    'order.paid',
              order:    order.data,
              provider: result,
            }),
          })
          await sb.from('shop_orders').update({ n8n_notified: true }).eq('id', result.orderId)
        } catch (e) {
          console.error('N8N notify failed:', e)
        }
      }
    } else if (result.status === 'failed') {
      await sb
        .from('shop_orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('id', result.orderId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
