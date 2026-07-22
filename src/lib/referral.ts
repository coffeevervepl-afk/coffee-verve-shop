import type { SupabaseClient } from '@supabase/supabase-js'

// Business rules for the "pack for a pack" referral program.
export const REFERRAL_MIN_ZL = 60   // minimum order subtotal (zł) for a referral to count
export const BONUS_WEIGHT    = 250  // free bonus pack weight (g)

export type ReferralCheck =
  | { valid: true;  referrerId: string; referrerAuthId: string | null }
  | { valid: false; reason: 'not_found' | 'self' | 'min_order' | 'not_new' }

/**
 * Validate a referral code against a would-be order. All checks are authoritative
 * and run server-side (service-role client). `currentOrderId` is excluded from the
 * "is this a new customer?" lookup when the order row already exists.
 */
export async function validateReferral(
  sb: SupabaseClient,
  code: string,
  email: string,
  subtotalZl: number,
  currentOrderId?: string,
): Promise<ReferralCheck> {
  const cleanCode = (code ?? '').trim()
  if (!cleanCode) return { valid: false, reason: 'not_found' }

  const { data: ref } = await sb
    .from('shop_users')
    .select('id, email, auth_user_id')
    .eq('referral_code', cleanCode)
    .maybeSingle()
  if (!ref) return { valid: false, reason: 'not_found' }

  if (ref.email && email && ref.email.toLowerCase() === email.toLowerCase()) {
    return { valid: false, reason: 'self' }
  }
  if (subtotalZl < REFERRAL_MIN_ZL) return { valid: false, reason: 'min_order' }

  // New customer only: no prior order for this email (excluding the current one).
  let q = sb.from('shop_orders').select('id').eq('customer_email', email).limit(1)
  if (currentOrderId) q = q.neq('id', currentOrderId)
  const { data: prior } = await q
  if (prior && prior.length > 0) return { valid: false, reason: 'not_new' }

  return { valid: true, referrerId: ref.id, referrerAuthId: ref.auth_user_id ?? null }
}
