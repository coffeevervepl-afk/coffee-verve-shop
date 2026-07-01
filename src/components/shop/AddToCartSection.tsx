'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductPrice } from '@/lib/supabase/products'
import { fmtPrice } from '@/lib/pricing'
import type { Locale, ProductWeight, ShopProduct } from '@/types/shop'

interface Props {
  product:  ShopProduct
  weights:  { w: ProductWeight; label: string }[]
  name:     string
  image:    string
  locale:   Locale
}

export default function AddToCartSection({ product, weights, name, image }: Props) {
  const t           = useTranslations('product')
  const [weight, setWeight] = useState<ProductWeight>(weights[0].w)
  const [qty, setQty]       = useState(1)
  const addItem             = useCartStore(s => s.addItem)
  const openDrawer          = useCartStore(s => s.openDrawer)
  const price               = getProductPrice(product, weight)

  function handleAdd() {
    addItem({ product_id: product.id, slug: product.slug, name, image, weight, unit_price: price, qty })
    toast.success(`${name} (${weight}g) — ${t('added')}`)
    openDrawer()
  }

  return (
    <div className="mt-auto space-y-5">
      {/* Weight selector */}
      {weights.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-brand-muted">{t('choose_weight')}</p>
          <div className="flex gap-2">
            {weights.map(({ w, label }) => (
              <button
                key={w}
                onClick={() => setWeight(w)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  w === weight
                    ? 'border-brand-accent bg-brand-accent text-white'
                    : 'border-brand-border text-brand-text hover:border-brand-accent'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs opacity-70">{fmtPrice(getProductPrice(product, w))}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-brand-muted">{t('quantity')}</p>
        <div className="flex items-center gap-3 rounded-full border border-brand-border px-1">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="btn-ghost rounded-full p-2"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="btn-ghost rounded-full p-2"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold">
          {fmtPrice(price * qty)}
        </span>
        <button onClick={handleAdd} className="btn btn-primary flex-1 gap-2">
          <ShoppingBag size={18} />
          {t('add_to_cart')}
        </button>
      </div>
    </div>
  )
}
