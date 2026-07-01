import { create } from 'zustand'
import type { CartItem } from '@/types/shop'

interface CartStore {
  items:       CartItem[]
  count:       number
  drawerOpen:  boolean

  setItems:    (items: CartItem[]) => void
  addItem:     (item: CartItem) => void
  removeItem:  (productId: string, weight: number) => void
  updateQty:   (productId: string, weight: number, qty: number) => void
  openDrawer:  () => void
  closeDrawer: () => void

  subtotal:    () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items:      [],
  count:      0,
  drawerOpen: false,

  setItems: (items) =>
    set({ items, count: items.reduce((s, i) => s + i.qty, 0) }),

  addItem: (item) => {
    const items = [...get().items]
    const idx   = items.findIndex(i => i.product_id === item.product_id && i.weight === item.weight)
    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: items[idx].qty + item.qty }
    } else {
      items.push(item)
    }
    set({ items, count: items.reduce((s, i) => s + i.qty, 0) })
  },

  removeItem: (productId, weight) => {
    const items = get().items.filter(i => !(i.product_id === productId && i.weight === weight))
    set({ items, count: items.reduce((s, i) => s + i.qty, 0) })
  },

  updateQty: (productId, weight, qty) => {
    if (qty <= 0) { get().removeItem(productId, weight); return }
    const items = get().items.map(i =>
      i.product_id === productId && i.weight === weight ? { ...i, qty } : i
    )
    set({ items, count: items.reduce((s, i) => s + i.qty, 0) })
  },

  openDrawer:  () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  subtotal: () => get().items.reduce((s, i) => s + i.unit_price * i.qty, 0),
}))
