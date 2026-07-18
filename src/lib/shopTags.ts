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

// brew_method is text[] (post-migration). Normalize defensively so a legacy
// single string is still handled correctly.
export function brewMethods(p: ShopProduct): string[] {
  const bm = p.brew_method as unknown
  if (Array.isArray(bm)) return bm as string[]
  return typeof bm === 'string' && bm ? [bm] : []
}
const hasBrew = (p: ShopProduct, method: string) => brewMethods(p).includes(method)
const MS_30D = 30 * 24 * 3600 * 1000

// Tag → server-side predicate. Grind (whole/ground) is a cart-time option, NOT
// a product attribute, so `ziarnista`/`mielona` match every coffee (no-op).
// Pourover is grouped under the CRM 'filter' method ("Фильтр / пуровер").
export const TAG_FILTERS: Record<string, (p: ShopProduct) => boolean> = {
  ekspres:     p => hasBrew(p, 'espresso'),
  turka:       p => hasBrew(p, 'turka'),
  milk:        p => hasBrew(p, 'espresso'),    // same beans as ekspres; separate tag for UX/SEO
  pourover:    p => hasBrew(p, 'filter'),
  aeropress:   p => hasBrew(p, 'aeropress'),
  frenchpress: p => hasBrew(p, 'frenchpress'),
  cup:         p => hasBrew(p, 'cup'),
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
