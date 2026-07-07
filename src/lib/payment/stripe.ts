import Stripe from 'stripe'
import type { PaymentProvider, CreatePaymentParams, PaymentResult, WebhookVerifyResult } from './types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: params.customerEmail,
      line_items: params.items.map(i => ({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: i.name },
          unit_amount: Math.round(i.amount * 100),
        },
        quantity: i.quantity,
      })),
      metadata: {
        orderId:     params.orderId,
        orderNumber: String(params.orderNumber),
        ...params.metadata,
      },
      success_url: params.successUrl,
      cancel_url:  params.cancelUrl,
    })

    return {
      provider:    'stripe',
      paymentRef:  session.id,
      redirectUrl: session.url!,
    }
  },

  async verifyWebhook(payload, signature): Promise<WebhookVerifyResult> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

    if (!webhookSecret || /REPLACE|placeholder/i.test(webhookSecret)) {
      throw new Error('STRIPE_WEBHOOK_SECRET is missing or still a placeholder. Set it to the real Stripe webhook signing secret from the Stripe Dashboard.')
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    )

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session
      return {
        orderId:    s.metadata?.orderId ?? '',
        paymentRef: s.id,
        status:     s.payment_status === 'paid' ? 'paid' : 'pending',
        amount:     (s.amount_total ?? 0) / 100,
      }
    }

    return { orderId: '', paymentRef: '', status: 'pending', amount: 0 }
  },
}
