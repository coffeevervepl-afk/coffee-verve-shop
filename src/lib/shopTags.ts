import type { ShopProduct } from '@/types/shop'

// Shared by the server /shop page (filtering) and the client TagFilters (chips).
// No 'use client' here, so the values are safe to use on the server.
export const TAG_KEYS = ['ziarnista', 'mielona', 'kg1', 'ekspres', 'turka', 'decaf'] as const
export type TagKey = (typeof TAG_KEYS)[number]

// Tag → server-side predicate. Grind (whole/ground) is a cart-time option, NOT
// a product attribute, so `ziarnista`/`mielona` match every coffee (no-op).
export const TAG_FILTERS: Record<string, (p: ShopProduct) => boolean> = {
  ziarnista: () => true,
  mielona:   () => true,
  kg1:       p => p.price_1000 != null,
  ekspres:   p => p.brew_method === 'espresso',
  turka:     p => (p.brew_method ?? '').toLowerCase().includes('turk'),
  decaf:     p => p.is_decaf === true,
}
