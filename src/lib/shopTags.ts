import type { ShopProduct } from '@/types/shop'

// Shared by the server /shop page (filtering) and the client TagFilters (chips).
// No 'use client' here, so the values are safe to use on the server.
// Order = display order; first COLLAPSED_TAGS are shown before "ещё ▼".
export const TAG_KEYS = [
  'ekspres', 'turka', 'milk',                                  // first row (always visible)
  'pourover', 'aeropress', 'frenchpress', 'cup',               // under "ещё"
  'ziarnista', 'mielona', 'kg1', 'decaf', 'lowacid', 'new',
] as const
export type TagKey = (typeof TAG_KEYS)[number]

export const COLLAPSED_TAGS = 3   // ekspres / turka / milk visible; rest under "ещё ▼"

const brew = (p: ShopProduct) => (p.brew_method ?? '').toLowerCase()
const MS_30D = 30 * 24 * 3600 * 1000

// Tag → server-side predicate. Grind (whole/ground) is a cart-time option, NOT
// a product attribute, so `ziarnista`/`mielona` match every coffee (no-op).
export const TAG_FILTERS: Record<string, (p: ShopProduct) => boolean> = {
  ekspres:     p => p.brew_method === 'espresso',
  turka:       p => brew(p).includes('turk'),
  milk:        p => p.brew_method === 'espresso',    // same beans as ekspres; separate tag for UX/SEO
  pourover:    p => brew(p).includes('pourover'),
  aeropress:   p => brew(p).includes('aeropress'),
  frenchpress: p => brew(p).includes('french'),
  cup:         p => brew(p).includes('cup'),
  ziarnista:   () => true,
  mielona:     () => true,
  kg1:         p => p.price_1000 != null,
  decaf:       p => p.is_decaf === true,
  lowacid:     p => p.acidity != null && p.acidity <= 2,
  new:         p => {
    const ts = new Date(p.created_at).getTime()
    return Number.isFinite(ts) && Date.now() - ts <= MS_30D
  },
}
