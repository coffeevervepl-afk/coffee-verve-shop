'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Minus, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductPrice } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import { extractDominantColor, FALLBACK_COLOR } from '@/lib/extractColor'
import type { Locale, ProductWeight, ShopProduct } from '@/types/shop'

interface Props {
  product:  ShopProduct
  weights:  { w: ProductWeight; label: string }[]
  name:     string
  image:    string
  locale:   Locale
}

const GRIND_SURCHARGE = 3

const GRIND_OPTIONS = [
  { value: 'espresso' },
  { value: 'aeropress' },
  { value: 'pourover' },
  { value: 'frenchpress' },
  { value: 'turka' },
  { value: 'moka' },
]

export default function AddToCartSection({ product, weights, name, image }: Props) {
  const t          = useTranslations('product')
  const [weight, setWeight]           = useState<ProductWeight>(weights[0].w)
  const [qty, setQty]                 = useState(1)
  const [grind, setGrind]             = useState<'whole' | 'ground'>('whole')
  const [grindOption, setGrindOption] = useState('espresso')
  const [switchBg, setSwitchBg]       = useState(FALLBACK_COLOR)
  const addItem    = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)
  const price      = getProductPrice(product, weight)

  const mainImage = product.images?.[0]

  useEffect(() => {
    if (!mainImage) return
    let cancelled = false
    extractDominantColor(mainImage).then(color => {
      if (!cancelled) setSwitchBg(color)
    })
    return () => { cancelled = true }
  }, [mainImage])

  const isDiscounted     = weight === 1000 && !!product.old_price_1000 && product.old_price_1000 > price
  const groundDisabled   = weight !== 250 // молотый доступен только для 250г
  const effectiveGrind   = groundDisabled ? 'whole' : grind
  const showGrindOptions = weight === 250 && grind === 'ground'
  const displayPrice      = effectiveGrind === 'ground' ? price + GRIND_SURCHARGE : price

  function selectWeight(w: ProductWeight) {
    setWeight(w)
    if (w !== 250) setGrindOption('espresso')
  }

  function selectGrind(g: 'whole' | 'ground') {
    setGrind(g)
    if (g === 'whole') setGrindOption('espresso')
  }

  function selectGrindOption(value: string) {
    setGrindOption(value)
  }

  function handleAdd() {
    addItem({
      product_id:  product.id,
      slug:        product.slug,
      name,
      image,
      weight,
      grind:       effectiveGrind,
      grindOption: effectiveGrind === 'ground' ? grindOption : undefined,
      unit_price:  displayPrice,
      qty,
    })
    toast.success(`${name} (${weight}g) — ${t('added')}`)
    openDrawer()
  }

  return (
    <>
      {/* ── Desktop inline controls (hidden on mobile) ─────────────── */}
      <div className="mt-4 hidden md:block space-y-2.5">
        <WeightSelector product={product} weights={weights} weight={weight} setWeight={selectWeight} bg={switchBg} />
        <GrindSelector
          grind={grind}
          effectiveGrind={effectiveGrind}
          groundDisabled={groundDisabled}
          showGrindOptions={showGrindOptions}
          grindOption={grindOption}
          setGrind={selectGrind}
          setGrindOption={selectGrindOption}
          bg={switchBg}
        />
        <QtySelector qty={qty} setQty={setQty} t={t} />
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            {isDiscounted && (
              <span key={weight} className="price-pop text-sm line-through text-[#999]">
                {fmtPrice(product.old_price_1000! * qty)}
              </span>
            )}
            <span className="text-2xl font-bold">{fmtPrice(displayPrice * qty)}</span>
            {effectiveGrind === 'ground' && (
              <span className="text-xs text-gray-400">{t('grind_surcharge')}</span>
            )}
          </div>
          <button onClick={handleAdd} className="btn h-[50px] flex-1 gap-2 bg-[#3A2115] text-[14px] text-white transition hover:-translate-y-px hover:bg-[#412618] active:translate-y-0">
            <ShoppingBag size={18} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>

      {/* ── Mobile: weight + grind + qty inline, sticky CTA bar at bottom ───── */}
      <div className="md:hidden space-y-2.5 mt-4">
        <WeightSelector product={product} weights={weights} weight={weight} setWeight={selectWeight} bg={switchBg} />
        <GrindSelector
          grind={grind}
          effectiveGrind={effectiveGrind}
          groundDisabled={groundDisabled}
          showGrindOptions={showGrindOptions}
          grindOption={grindOption}
          setGrind={selectGrind}
          setGrindOption={selectGrindOption}
          bg={switchBg}
        />
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
            <span className="text-xl font-bold">{fmtPrice(displayPrice * qty)}</span>
            {effectiveGrind === 'ground' && (
              <span className="text-xs text-gray-400">{t('grind_surcharge')}</span>
            )}
          </div>
          <button onClick={handleAdd} className="btn h-[50px] flex-1 gap-2 bg-[#3A2115] text-[14px] text-white transition hover:-translate-y-px hover:bg-[#412618] active:translate-y-0">
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
  product, weights, weight, setWeight, bg,
}: {
  product: ShopProduct
  weights: { w: ProductWeight; label: string }[]
  weight:  ProductWeight
  setWeight: (w: ProductWeight) => void
  bg: string
}) {
  const t = useTranslations('product')
  if (weights.length <= 1) return null
  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-brand-muted">{t('choose_weight')}</p>
      <div className="flex w-full gap-2 rounded-2xl bg-transparent p-0">
        {weights.map(({ w, label }) => (
          <button
            key={w}
            onClick={() => setWeight(w)}
            style={{ backgroundColor: w === weight ? '#3A2115' : bg }}
            className={`relative flex h-[46px] flex-1 flex-col items-center justify-center rounded-[14px] border px-3 py-2 text-[14px] transition-colors ${
              w === weight
                ? 'border-[#3A2115] text-white font-bold'
                : 'border-[#E8E7E3] text-[#3A2115] font-medium'
            }`}
          >
            <span className="flex items-center">
              {label}
              <span className="ml-1.5 text-[11px] font-semibold opacity-70">
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

function GrindSelector({
  grind, effectiveGrind, groundDisabled, showGrindOptions, grindOption, setGrind, setGrindOption, bg,
}: {
  grind:            'whole' | 'ground'
  effectiveGrind:   'whole' | 'ground'
  groundDisabled:   boolean
  showGrindOptions: boolean
  grindOption:      string
  setGrind:         (g: 'whole' | 'ground') => void
  setGrindOption:   (value: string) => void
  bg:               string
}) {
  const t = useTranslations('product')
  return (
    <div>
      <div className="flex w-full gap-2 rounded-2xl bg-transparent p-0">
        <button
          onClick={() => setGrind('whole')}
          style={{ backgroundColor: effectiveGrind === 'whole' ? '#3A2115' : bg }}
          className={`relative flex h-[46px] flex-1 items-center justify-center rounded-[14px] border px-3 py-2 text-[14px] transition-colors ${
            effectiveGrind === 'whole'
              ? 'border-[#3A2115] text-white font-bold'
              : 'border-[#E8E7E3] text-[#3A2115] font-medium'
          }`}
        >
          {t('grind_whole')}
        </button>

        <div className="group relative flex-1">
          <button
            onClick={() => setGrind('ground')}
            disabled={groundDisabled}
            style={{ backgroundColor: groundDisabled ? undefined : (effectiveGrind === 'ground' ? '#3A2115' : bg) }}
            className={`relative flex h-[46px] w-full items-center justify-center rounded-[14px] border px-3 py-2 text-[14px] transition-colors ${
              groundDisabled
                ? 'cursor-not-allowed border-[#E8E7E3] text-[#3A2115] opacity-40'
                : effectiveGrind === 'ground'
                ? 'border-[#3A2115] text-white font-bold'
                : 'border-[#E8E7E3] text-[#3A2115] font-medium'
            }`}
          >
            {t('grind_ground')}
          </button>

          {groundDisabled && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-[#111110] px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {t('grind_tooltip')}
            </div>
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          showGrindOptions ? 'mt-2 max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {GRIND_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGrindOption(opt.value)}
              className={`rounded-full border px-3 py-1 text-[13px] font-medium transition ${
                grindOption === opt.value
                  ? 'border-[#3A2115] bg-[#3A2115] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#3A2115]'
              }`}
            >
              {t(`grind_${opt.value}`)}
            </button>
          ))}
        </div>
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
      <p className="text-[12px] font-medium text-brand-muted">{t('quantity')}</p>
      <div className="flex items-center gap-3 rounded-full border border-brand-border px-1">
        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="btn-ghost rounded-full p-[5px]">
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
        <button onClick={() => setQty(q => q + 1)} className="btn-ghost rounded-full p-[5px]">
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
