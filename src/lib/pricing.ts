import type { CartItem, PricingSummary } from '@/types/shop'

const FREE_DELIVERY_THRESHOLD  = Number(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? 150)
const DELIVERY_COST_PACZKOMAT  = 14.99
const DELIVERY_COST_COURIER    = 19.99

export interface PromoDiscount {
  id:       string
  code:     string
  type:     'percent' | 'fixed'
  value:    number
  category: string
}

export interface DiscountResult {
  discount_pct:    number
  discount_amount: number
  discount_source: 'loyalty' | 'promo' | 'b2b' | 'none'
  applied_label:   string   // shown in UI
}

/**
 * Choose the best discount: loyalty level vs promo code.
 * B2B customers skip loyalty levels entirely (b2b_discount is applied).
 */
export function chooseBestDiscount(
  subtotal:       number,
  loyaltyPct:     number,          // from loyalty_config (classic=5, gold=10, platinum=15)
  promo:          PromoDiscount | null,
  isB2b:          boolean,
  b2bDiscount:    number,          // only used if isB2b
): DiscountResult {
  if (isB2b) {
    const amt = Math.round(subtotal * b2bDiscount) / 100
    return { discount_pct: b2bDiscount, discount_amount: amt, discount_source: 'b2b', applied_label: `B2B −${b2bDiscount}%` }
  }

  // Calculate loyalty discount value
  const loyaltyAmt = Math.round(subtotal * loyaltyPct) / 100

  // Calculate promo discount value
  let promoAmt = 0
  if (promo) {
    promoAmt = promo.type === 'percent'
      ? Math.round(subtotal * promo.value) / 100
      : Math.min(promo.value, subtotal)
  }

  if (promo && promoAmt >= loyaltyAmt) {
    const pct = promo.type === 'percent' ? promo.value : Math.round((promoAmt / subtotal) * 100)
    return {
      discount_pct:    pct,
      discount_amount: promoAmt,
      discount_source: 'promo',
      applied_label:   `Промокод ${promo.code} −${promo.type === 'percent' ? promo.value + '%' : promoAmt + ' zł'}`,
    }
  }

  if (loyaltyPct > 0) {
    return {
      discount_pct:    loyaltyPct,
      discount_amount: loyaltyAmt,
      discount_source: 'loyalty',
      applied_label:   `Скидка уровня −${loyaltyPct}%`,
    }
  }

  return { discount_pct: 0, discount_amount: 0, discount_source: 'none', applied_label: '' }
}

export function calcPricing(
  items:        CartItem[],
  deliveryType: 'paczkomat' | 'courier' | 'pickup',
  isRegistered: boolean,
  loyaltyPct    = 0,
  promo:        PromoDiscount | null = null,
  isB2b         = false,
  b2bDiscount   = 0,
): PricingSummary & { discount_source: string; discount_label: string } {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0)

  // Legacy: if registered but no loyalty info yet, use env default (5%)
  const effectiveLoyaltyPct = isRegistered && loyaltyPct === 0
    ? Number(process.env.NEXT_PUBLIC_REGISTERED_DISCOUNT_PCT ?? 5)
    : loyaltyPct

  const disc = chooseBestDiscount(subtotal, effectiveLoyaltyPct, promo, isB2b, b2bDiscount)

  const afterDiscount    = Math.round((subtotal - disc.discount_amount) * 100) / 100
  const is_free_delivery = afterDiscount >= FREE_DELIVERY_THRESHOLD || deliveryType === 'pickup'
  const delivery_cost    = is_free_delivery ? 0
    : deliveryType === 'courier' ? DELIVERY_COST_COURIER : DELIVERY_COST_PACZKOMAT

  return {
    subtotal,
    discount_pct:          disc.discount_pct,
    discount_amount:       disc.discount_amount,
    delivery_cost,
    total:                 Math.round((afterDiscount + delivery_cost) * 100) / 100,
    is_free_delivery,
    free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
    discount_source:       disc.discount_source,
    discount_label:        disc.applied_label,
  }
}

export function fmtPrice(n: number, currency = 'zł'): string {
  return `${n.toFixed(2).replace('.', ',')} ${currency}`
}
