import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { getPaymentProvider } from '@/lib/payment'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
               ?? req.headers.get('x-signature')
               ?? ''

  try {
    const provider = getPaymentProvider()
    // Authenticity gate: throws on a missing/placeholder secret or a bad
    // signature, so nothing below runs for a forged request. (Stripe:
    // stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET.)
    const result   = await provider.verifyWebhook(Buffer.from(body), signature)

    if (!result.orderId) return NextResponse.json({ ok: true })

    // Service-role client: order status writes bypass RLS. Safe here ONLY
    // because the signature was verified above. Anon/customers can no longer
    // UPDATE shop_orders directly (see shop_orders_staff_update policy).
    const sb = createServiceSupabase()

    // Update payment status
    if (result.status === 'paid') {
      await sb
        .from('shop_orders')
        .update({ payment_status: 'paid', status: 'processing', payment_ref: result.paymentRef })
        .eq('id', result.orderId)

      if (result.metadata?.register_intent === '1') {
        const password = result.metadata.register_password ?? ''
        if (password.length >= 6) {
          try {
            await fetch(`${SITE_URL}/api/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: result.metadata.register_email,
                password,
                name: result.metadata.register_name,
                phone: result.metadata.register_phone,
                language: result.metadata.locale ?? 'ru',
                orderId: result.orderId,
              }),
            })
            console.log(`Ваш аккаунт создан, войдите на coffeeverve.pl/ru/account/login (${result.metadata.register_email})`)
          } catch (err) {
            console.error('Auto register after paid failed:', err)
          }
        }
      }

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
    const message = err instanceof Error ? err.message : 'Webhook failed'
    console.error('Webhook error:', message, err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
