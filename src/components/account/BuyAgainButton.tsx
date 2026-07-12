'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductName, getProductImage, getProductPrice } from '@/lib/product-utils'
import type { Locale, ShopProduct } from '@/types/shop'

// Same ground-coffee surcharge the product card applies.
const GRIND_SURCHARGE = 3

interface Props {
  locale:        Locale
  shopProductId: string | null
  slug:          string | null
  weight:        number
  grind:         string | null
  grindOption:   string | null
}

export default function BuyAgainButton({ locale, shopProductId, slug, weight, grind, grindOption }: Props) {
  const t    = useTranslations('dashboard')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const sb = createClient()
      // Re-fetch the current product so the item carries a live image/price and
      // we can tell if it was removed or deactivated since the original order.
      // Keep all filter (.eq) calls before the transform (.limit/.maybeSingle) —
      // .limit() returns a transform builder that no longer exposes .eq().
      let query = sb.from('shop_products').select('*').eq('is_active', true)
      if (shopProductId)  query = query.eq('id', shopProductId)
      else if (slug)      query = query.eq('slug', slug)
      else { toast.error(t('reorder_unavailable')); return }

      const { data, error } = await query.limit(1).maybeSingle()
      if (error || !data) { toast.error(t('reorder_unavailable')); return }

      const product = data as ShopProduct
      const w = weight as 250 | 500 | 1000
      const isGround = grind === 'ground'
      const unit_price = getProductPrice(product, w) + (isGround ? GRIND_SURCHARGE : 0)

      add({
        product_id:  product.id,
        slug:        product.slug,
        name:        getProductName(product, locale),
        image:       getProductImage(product),
        weight:      w,
        grind:       isGround ? 'ground' : 'whole',
        grindOption: isGround ? (grindOption ?? undefined) : undefined,
        unit_price,
        qty:         1,
      })
      toast.success(t('added_to_cart'))
      open()
    } catch {
      toast.error(t('reorder_unavailable'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-full border border-brand-border px-2 py-0.5 text-[11px] font-medium text-[#3A2115] transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? '…' : t('buy_again')}
    </button>
  )
}
