import type { ShopProduct } from '@/types/shop'

// brew_method is text[] (post-migration). Normalize defensively so a legacy
// single string is still handled correctly. Shared by shopSlugs (filtering),
// the product page and ProductTabs (display). No 'use client' — server-safe.
export function brewMethods(p: ShopProduct): string[] {
  const bm = p.brew_method as unknown
  if (Array.isArray(bm)) return bm as string[]
  return typeof bm === 'string' && bm ? [bm] : []
}
