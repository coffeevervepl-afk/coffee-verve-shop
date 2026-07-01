// Pure client-safe utility functions — no server imports
import type { Locale, ShopProduct } from '@/types/shop'

export function getProductName(p: ShopProduct, locale: Locale): string {
  return (p as any)[`name_${locale}`] || p.name_ru
}

export function getProductDescription(p: ShopProduct, locale: Locale): string {
  return (p as any)[`description_${locale}`] || p.description_ru || ''
}

export function getProductFlavorNotes(p: ShopProduct, locale: Locale): string {
  return (p as any)[`flavor_notes_${locale}`] || p.flavor_notes_ru || ''
}

export function getProductPrice(p: ShopProduct, weight: 250 | 500 | 1000): number {
  if (weight === 500 && p.price_500) return Number(p.price_500)
  if (weight === 1000 && p.price_1000) return Number(p.price_1000)
  return Number(p.price_250)
}

export function getProductImage(p: ShopProduct): string {
  return p.images?.[0] ?? '/images/placeholder.jpg'
}
