/**
 * Provider-agnostic payment abstraction.
 * Add new providers (Przelewy24, BLIK) without changing checkout flow.
 */

export interface PaymentLineItem {
  name:     string
  amount:   number   // in PLN (not cents)
  quantity: number
}

export interface CreatePaymentParams {
  orderId:     string
  orderNumber: number
  amount:      number        // total in PLN
  currency:    string        // 'PLN'
  items:       PaymentLineItem[]
  customerEmail: string
  customerName:  string
  successUrl:  string
  cancelUrl:   string
  metadata?:   Record<string, string>
}

export interface PaymentResult {
  provider:   string
  paymentRef: string          // session/transaction ID
  redirectUrl: string         // send user here to complete payment
}

export interface WebhookVerifyResult {
  orderId:     string
  paymentRef:  string
  status:      'paid' | 'failed' | 'pending'
  amount:      number
  metadata?:   Record<string, string>
}

export interface PaymentProvider {
  name: string
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  verifyWebhook(payload: string | Buffer, signature: string): Promise<WebhookVerifyResult>
}
