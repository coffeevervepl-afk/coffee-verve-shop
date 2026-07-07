import { createClient } from './client'

export interface SessionUser {
  id:                    string
  email:                 string
  name:                  string
  discount_pct:          number
  telegram:              string | null
  loyalty_level:         'classic' | 'gold' | 'platinum'
  spent_12m:             number
  referral_code:         string | null
  taste_profile:         Record<string, string> | null
  birthday:              string | null
  phone:                 string | null
  language:              string | null
  is_b2b:                boolean
  b2b_discount:          number | null
  min_discount_until:    string | null
  last_purchase_at:      string | null
}

export async function signUpUser(email: string, password: string) {
  const sb = createClient()
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInUser(email: string, password: string) {
  const sb = createClient()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOutUser() {
  const sb = createClient()
  await sb.auth.signOut()
}

export async function getAuthSession() {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  return session
}

export async function getShopUser(email: string): Promise<SessionUser | null> {
  const sb = createClient()
  const { data } = await sb
    .from('shop_users')
    .select('id,email,name,telegram,loyalty_level,spent_12m,referral_code,taste_profile,birthday,is_b2b,b2b_discount,min_discount_until,last_purchase_at')
    .eq('email', email)
    .single()
  return data as SessionUser | null
}

export function getLoyaltyDiscount(level: string, config: Record<string, number>): number {
  if (level === 'platinum') return config.platinum_discount ?? 15
  if (level === 'gold')     return config.gold_discount    ?? 10
  return                           config.classic_discount  ?? 5
}

export function getLoyaltyColor(level: string): string {
  if (level === 'platinum') return 'from-slate-600 to-slate-900'
  if (level === 'gold')     return 'from-amber-400 to-yellow-600'
  return                           'from-gray-400 to-gray-600'
}

export function getLoyaltyLabel(level: string): string {
  if (level === 'platinum') return 'Platinum'
  if (level === 'gold')     return 'Gold'
  return                           'Classic'
}

export function getNextLevel(level: string, spent: number, config: Record<string, number>) {
  if (level === 'platinum') return null
  const threshold = level === 'gold'
    ? config.platinum_threshold ?? 1800
    : config.gold_threshold     ?? 600
  const nextName  = level === 'gold' ? 'Platinum' : 'Gold'
  return { name: nextName, threshold, remaining: Math.max(0, threshold - spent) }
}
