'use server'
import { cookies } from 'next/headers'
import { createServerSupabase } from './server'
import type { Cart, CartItem } from '@/types/shop'
import { v4 as uuidv4 } from 'uuid'

const CART_COOKIE = 'cv_cart_session'

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sid = cookieStore.get(CART_COOKIE)?.value
  if (!sid) {
    sid = uuidv4()
    cookieStore.set(CART_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }
  return sid
}

export async function getCart(): Promise<Cart | null> {
  const sid = await getSessionId()
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('shop_carts')
    .select('*')
    .eq('session_id', sid)
    .single()
  return data
}

export async function addToCart(item: CartItem): Promise<Cart> {
  const sid = await getSessionId()
  const sb = await createServerSupabase()

  const { data: existing } = await sb
    .from('shop_carts')
    .select('*')
    .eq('session_id', sid)
    .single()

  let items: CartItem[] = existing?.items ?? []
  const idx = items.findIndex(
    i => i.product_id === item.product_id && i.weight === item.weight
  )

  if (idx >= 0) {
    items[idx].qty += item.qty
  } else {
    items.push(item)
  }

  const { data, error } = await sb
    .from('shop_carts')
    .upsert({ session_id: sid, items, updated_at: new Date().toISOString() }, { onConflict: 'session_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCartItem(
  productId: string,
  weight: number,
  qty: number
): Promise<Cart> {
  const sid = await getSessionId()
  const sb = await createServerSupabase()

  const { data: existing } = await sb
    .from('shop_carts')
    .select('*')
    .eq('session_id', sid)
    .single()

  let items: CartItem[] = existing?.items ?? []

  if (qty <= 0) {
    items = items.filter(i => !(i.product_id === productId && i.weight === weight))
  } else {
    const idx = items.findIndex(i => i.product_id === productId && i.weight === weight)
    if (idx >= 0) items[idx].qty = qty
  }

  const { data, error } = await sb
    .from('shop_carts')
    .upsert({ session_id: sid, items, updated_at: new Date().toISOString() }, { onConflict: 'session_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function clearCart(): Promise<void> {
  const sid = await getSessionId()
  const sb = await createServerSupabase()
  await sb.from('shop_carts').delete().eq('session_id', sid)
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price * i.qty, 0)
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0)
}
