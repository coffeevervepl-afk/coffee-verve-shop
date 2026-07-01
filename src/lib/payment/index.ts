/**
 * Payment provider registry.
 * Switch provider by setting NEXT_PUBLIC_PAYMENT_PROVIDER env var.
 * No checkout code changes needed when adding Przelewy24 / BLIK.
 */
import type { PaymentProvider } from './types'
import { stripeProvider } from './stripe'

// Future: import { przelewy24Provider } from './przelewy24'
// Future: import { blikProvider } from './blik'

const registry: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
  // przelewy24: przelewy24Provider,
  // blik: blikProvider,
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe'
  const provider = registry[name]
  if (!provider) throw new Error(`Unknown payment provider: ${name}`)
  return provider
}

export type { CreatePaymentParams, PaymentResult, WebhookVerifyResult, PaymentProvider } from './types'
