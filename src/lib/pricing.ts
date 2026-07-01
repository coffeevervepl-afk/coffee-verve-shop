import type { CartItem, PricingSummary } from '@/types/shop'

const REGISTERED_DISCOUNT_PCT = Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)
const FREE_DELIVERY_THRESHOLD  = Number(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? 150)
const DELIVERY_COST_PACZKOMAT  = 14.99
const DELIVERY_COST_COURIER    = 19.99

export function calcPricing(
  items: CartItem[],
  deliveryType: 'paczkomat' | 'courier' | 'pickup',
  isRegistered: boolean,
): PricingSummary {
  const subtotal      = items.reduce((s, i) => s + i.unit_price * i.qty, 0)
  const discount_pct  = isRegistered ? REGISTERED_DISCOUNT_PCT : 0
  const discount_amount = Math.round(subtotal * discount_pct) / 100

  const afterDiscount = subtotal - discount_amount
  const is_free_delivery = afterDiscount >= FREE_DELIVERY_THRESHOLD || deliveryType === 'pickup'
  let delivery_cost = 0
  if (!is_free_delivery) {
    delivery_cost = deliveryType === 'courier' ? DELIVERY_COST_COURIER : DELIVERY_COST_PACZKOMAT
  }

  return {
    subtotal,
    discount_pct,
    discount_amount,
    delivery_cost,
    total: Math.round((afterDiscount + delivery_cost) * 100) / 100,
    is_free_delivery,
    free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
  }
}

export function fmtPrice(n: number, currency = 'zł'): string {
  return `${n.toFixed(2).replace('.', ',')} ${currency}`
}
