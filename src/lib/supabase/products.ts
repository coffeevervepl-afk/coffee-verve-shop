import { createServerSupabase } from './server'
import type { Locale, ShopProduct } from '@/types/shop'

export async function getProducts(): Promise<ShopProduct[]> {
  const sb = await createServerSupabase()
  // Embed bundle composition (empty for normal single products).
  const { data, error } = await sb
    .from('shop_products')
    .select('*, bundle_items:shop_bundle_items!shop_bundle_items_bundle_id_fkey(product_id, weight, component:shop_products!shop_bundle_items_product_id_fkey(name_ru, slug, price_250, images))')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map((p: any) => ({
    ...p,
    bundle_items: (p.bundle_items ?? []).map((bi: any) => ({
      product_id: bi.product_id,
      name:       bi.component?.name_ru ?? '',
      slug:       bi.component?.slug ?? '',
      weight:     bi.weight,
      price:      Number(bi.component?.price_250 ?? 0),
      image:      bi.component?.images?.[0] ?? '',
    })),
  })) as ShopProduct[]
}

export async function getFeaturedProducts(): Promise<ShopProduct[]> {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('shop_products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
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

// Pure utility functions — no 'use server' needed
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
