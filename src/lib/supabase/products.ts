'use server'
import { createServerSupabase } from './server'
import type { Locale, ShopProduct } from '@/types/shop'

export async function getProducts(): Promise<ShopProduct[]> {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('shop_products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('shop_products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export function getProductName(p: ShopProduct, locale: Locale): string {
  return p[`name_${locale}`] || p.name_ru
}

export function getProductDescription(p: ShopProduct, locale: Locale): string {
  return p[`description_${locale}`] || p.description_ru || ''
}

export function getProductFlavorNotes(p: ShopProduct, locale: Locale): string {
  return p[`flavor_notes_${locale}`] || p.flavor_notes_ru || ''
}

export function getProductPrice(p: ShopProduct, weight: 250 | 500 | 1000): number {
  if (weight === 500 && p.price_500) return p.price_500
  if (weight === 1000 && p.price_1000) return p.price_1000
  return p.price_250
}

export function getProductImage(p: ShopProduct): string {
  return p.images?.[0] ?? '/images/placeholder.jpg'
}
