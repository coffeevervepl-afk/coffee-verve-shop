'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductPrice } from '@/lib/product-utils'
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
  const t          = useTranslations('product')
  const [weight, setWeight] = useState<ProductWeight>(weights[0].w)
  const [qty, setQty]       = useState(1)
  const addItem    = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)
  const price      = getProductPrice(product, weight)

  const isDiscounted = weight === 1000 && !!product.old_price_1000 && product.old_price_1000 > price

  function handleAdd() {
    addItem({ product_id: product.id, slug: product.slug, name, image, weight, unit_price: price, qty })
    toast.success(`${name} (${weight}g) — ${t('added')}`)
    openDrawer()
  }

  return (
    <>
      {/* ── Desktop inline controls (hidden on mobile) ─────────────── */}
      <div className="mt-auto hidden md:block space-y-5">
        <WeightSelector product={product} weights={weights} weight={weight} setWeight={setWeight} />
        <QtySelector qty={qty} setQty={setQty} t={t} />
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            {isDiscounted && (
              <span key={weight} className="price-pop text-sm line-through text-[#999]">
                {fmtPrice(product.old_price_1000! * qty)}
              </span>
            )}
            <span className="text-2xl font-bold">{fmtPrice(price * qty)}</span>
          </div>
          <button onClick={handleAdd} className="btn btn-primary flex-1 gap-2">
            <ShoppingBag size={18} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>

      {/* ── Mobile: weight + qty inline, sticky CTA bar at bottom ───── */}
      <div className="md:hidden space-y-4 mt-4">
        <WeightSelector product={product} weights={weights} weight={weight} setWeight={setWeight} />
        <QtySelector qty={qty} setQty={setQty} t={t} />
      </div>

      {/* Sticky bottom bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-border bg-brand-surface/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            {isDiscounted && (
              <span key={weight} className="price-pop text-sm line-through text-[#999]">
                {fmtPrice(product.old_price_1000! * qty)}
              </span>
            )}
            <span className="text-xl font-bold">{fmtPrice(price * qty)}</span>
          </div>
          <button onClick={handleAdd} className="btn btn-primary flex-1 gap-2 py-3">
            <ShoppingBag size={18} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind sticky bar on mobile */}
      <div className="h-20 md:hidden" />

      <style jsx>{`
        .price-pop {
          animation: priceScaleIn 200ms ease;
        }
        @keyframes priceScaleIn {
          from { transform: scale(1.05); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}

function WeightSelector({
  product, weights, weight, setWeight,
}: {
  product: ShopProduct
  weights: { w: ProductWeight; label: string }[]
  weight:  ProductWeight
  setWeight: (w: ProductWeight) => void
}) {
  const t = useTranslations('product')
  if (weights.length <= 1) return null
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-brand-muted">{t('choose_weight')}</p>
      <div className="flex w-full gap-2 rounded-2xl bg-transparent p-0">
        {weights.map(({ w, label }) => (
          <button
            key={w}
            onClick={() => setWeight(w)}
            className={`relative flex h-[60px] flex-1 flex-col items-center justify-center rounded-[14px] border px-4 py-2 text-[18px] backdrop-blur-[12px] transition-all ${
              w === weight
                ? 'border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.95)] text-[#111110] font-bold shadow-[0_2px_12px_rgba(0,0,0,0.1)]'
                : 'border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.5)] text-[#3D3C39] hover:bg-[rgba(255,255,255,0.75)]'
            }`}
          >
            <span className="flex items-center">
              {label}
              <span className="ml-1.5 text-[15px] font-semibold opacity-70">
                {fmtPrice(getProductPrice(product, w))}
              </span>
            </span>
            {w === 1000 && w === weight && product.old_price_1000 && product.old_price_1000 > getProductPrice(product, w) && (
              <span className="text-[11px] text-[rgba(255,255,255,0.6)]">{t('save_amount')}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function QtySelector({
  qty, setQty, t,
}: {
  qty: number
  setQty: (fn: (q: number) => number) => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-sm font-medium text-brand-muted">{t('quantity')}</p>
      <div className="flex items-center gap-3 rounded-full border border-brand-border px-1">
        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="btn-ghost rounded-full p-2">
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
        <button onClick={() => setQty(q => q + 1)} className="btn-ghost rounded-full p-2">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
