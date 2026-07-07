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

const CTA_CLASS =
  'flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#C47B2A] text-base font-bold text-white transition-all duration-150 hover:-translate-y-px hover:bg-[#d98c37]'

export default function AddToCartSection({ product, weights, name, image }: Props) {
  const t          = useTranslations('product')
  const [weight, setWeight] = useState<ProductWeight>(weights[0].w)
  const [qty, setQty]       = useState(1)
  const addItem    = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)
  const price      = getProductPrice(product, weight)

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
          <span className="text-2xl font-bold">{fmtPrice(price * qty)}</span>
          <button onClick={handleAdd} className={CTA_CLASS}>
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
          <span className="text-xl font-bold">{fmtPrice(price * qty)}</span>
          <button onClick={handleAdd} className={CTA_CLASS}>
            <ShoppingBag size={18} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind sticky bar on mobile */}
      <div className="h-20 md:hidden" />
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
      <div className="flex flex-wrap gap-[10px]">
        {weights.map(({ w, label }) => {
          const active = w === weight
          return (
            <button
              key={w}
              onClick={() => setWeight(w)}
              className={`flex h-[52px] flex-col items-center justify-center rounded-xl px-5 transition-colors duration-150 ${
                active
                  ? 'bg-[#111110] text-white'
                  : 'border-[1.5px] border-[#E8E7E3] bg-white text-[#111110] hover:border-[#111110]'
              }`}
            >
              <span className="text-[15px] font-bold leading-tight">{label}</span>
              <span className={`text-[13px] leading-tight ${active ? 'text-white/70' : 'text-[#6E6D68]'}`}>
                {fmtPrice(getProductPrice(product, w))}
              </span>
            </button>
          )
        })}
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
