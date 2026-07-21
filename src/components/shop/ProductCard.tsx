'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import type { Locale, ShopProduct, ProductWeight } from '@/types/shop'
import { getProductName, getProductFlavorNotes, getProductImage, getProductPrice } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import { getFlavorColor } from '@/lib/flavorColors'
import { extractDominantColor, FALLBACK_COLOR } from '@/lib/extractColor'

interface Props {
  product: ShopProduct
  locale:  Locale
}

const GRIND_SURCHARGE = 3

const GRIND_OPTIONS = [
  { value: 'espresso',    paid: true },
  { value: 'aeropress',   paid: true },
  { value: 'pourover',    paid: true },
  { value: 'frenchpress', paid: true },
  { value: 'turka',       paid: true },
  { value: 'moka',        paid: true },
]

export default function ProductCard({ product, locale }: Props) {
  const t    = useTranslations('product')
  const tb   = useTranslations('shop')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)
  const [weight, setWeight]           = useState<250 | 1000>(250)
  const [grind, setGrind]             = useState<'whole' | 'ground'>('whole')
  const [grindOption, setGrindOption] = useState('espresso')
  const [isHovered, setIsHovered]     = useState(false)
  const [switchBg, setSwitchBg]       = useState(FALLBACK_COLOR)

  const name      = getProductName(product, locale)
  const notes     = getProductFlavorNotes(product, locale)
  const noteList  = notes ? notes.split('•').map(n => n.trim()).filter(Boolean) : []
  const image     = getProductImage(product)
  const basePrice = getProductPrice(product, weight)
  const has1kg = !!product.price_1000

  const bundleItems       = product.bundle_items ?? []
  // Strict: a set only when explicitly typed 'bundle' AND it has real
  // composition. Anything else (single / null / mis-typed empty) is a normal card.
  const isBundle          = product.product_type === 'bundle' && bundleItems.length > 0
  const bundleCount       = bundleItems.length
  const bundleUnitWeight  = bundleItems[0]?.weight ?? 250
  const bundleTotalWeight = bundleItems.reduce((s, b) => s + (b.weight || 0), 0)
  const bundleNames       = bundleItems.map(b => b.name).filter(Boolean).join(' · ')
  const bundlePrice       = getProductPrice(product, 250)

  useEffect(() => {
    let cancelled = false
    extractDominantColor(image).then(color => {
      if (!cancelled) setSwitchBg(color)
    })
    return () => { cancelled = true }
  }, [image])

  const isDiscounted      = weight === 1000 && !!product.old_price_1000 && product.old_price_1000 > basePrice
  const groundDisabled    = weight === 1000
  const effectiveGrind    = groundDisabled ? 'whole' : grind
  const showGrindOptions  = weight === 250 && grind === 'ground'
  // Grinding a bundle = surcharge per pack (one grind choice for the whole set).
  const bundleSurcharge   = GRIND_SURCHARGE * bundleCount
  const displayPrice      = isBundle
    ? bundlePrice + (effectiveGrind === 'ground' ? bundleSurcharge : 0)
    : (effectiveGrind === 'ground' ? basePrice + GRIND_SURCHARGE : basePrice)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (isBundle) {
      // Bundle = one cart line: total weight, whole beans, bundle price.
      add({
        product_id:  product.id,
        slug:        product.slug,
        name,
        image,
        weight:      (bundleTotalWeight || 1000) as ProductWeight,
        grind:       effectiveGrind,
        grindOption: effectiveGrind === 'ground' ? grindOption : undefined,
        unit_price:  displayPrice,
        qty:         1,
      })
    } else {
      add({
        product_id:  product.id,
        slug:        product.slug,
        name,
        image,
        weight,
        grind:       effectiveGrind,
        grindOption: effectiveGrind === 'ground' ? grindOption : undefined,
        unit_price:  displayPrice,
        qty:         1,
      })
    }
    toast.success(`${name} — добавлено`)
    open()
  }

  function selectWeight(e: React.MouseEvent, w: 250 | 1000) {
    e.preventDefault()
    setWeight(w)
    if (w === 1000) setGrindOption('espresso')
  }

  function selectGrind(e: React.MouseEvent, g: 'whole' | 'ground') {
    e.preventDefault()
    setGrind(g)
    if (g === 'whole') setGrindOption('espresso')
  }

  function selectGrindOption(e: React.MouseEvent, value: string) {
    e.preventDefault()
    setGrindOption(value)
  }

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="card h-full min-w-0 lg:min-w-[240px] flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-brand-border/30">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isBundle ? (
            <span className="absolute left-2 top-2 rounded-full bg-[#3A2115] px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
              {tb('bundle.badge')}
            </span>
          ) : product.is_featured && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
              Pick
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 line-clamp-2 min-h-[2.5rem] text-lg md:text-sm font-semibold leading-snug">{name}</h3>
            <button
              type="button"
              className="card-details-btn shrink-0 rounded-full border border-[#E8E7E3] bg-white/70 px-4 py-1.5 text-[13px] font-medium text-[#3A2115] shadow-sm backdrop-blur-sm"
            >
              {t('details_btn')}
            </button>
          </div>
          {isBundle ? (
            <>
              {bundleCount > 0 && (
                <p className="mt-0.5 text-[11px] font-medium text-[#8A7A66]">
                  {tb('bundle.composition', { count: bundleCount, weight: bundleUnitWeight, total: bundleTotalWeight })}
                </p>
              )}
              {bundleNames && (
                <p title={bundleNames} className="mt-1 min-h-[2rem] truncate text-xs md:text-[13px] text-[#6E6D68]">{bundleNames}</p>
              )}
            </>
          ) : notes && (
            <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs md:text-[13px]">
              {noteList.map((note, i) => (
                <span key={i}>
                  <span
                    className="transition-colors duration-300"
                    style={{ color: isHovered ? getFlavorColor(note).text : '#6E6D68' }}
                  >
                    {note}
                  </span>
                  {i < noteList.length - 1 && <span style={{ color: '#6E6D68' }}> • </span>}
                </span>
              ))}
            </p>
          )}

          {!isBundle && (product.body != null || product.acidity != null) && (
            <div className="mb-2 mt-1.5 space-y-1.5">
              {product.body != null && (
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] font-medium text-gray-600">{t('body')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i <= product.body! ? 'bg-[#412618]' : 'bg-transparent border border-[#D8D3CC]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {product.acidity != null && (
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] font-medium text-gray-600">{t('acidity')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i <= product.acidity! ? 'bg-[#412618]' : 'bg-transparent border border-[#D8D3CC]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isBundle && has1kg && (
            <div className="mt-1.5 flex gap-1 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: switchBg }}>
              {([250, 1000] as const).map(w => (
                <button
                  key={w}
                  onClick={e => selectWeight(e, w)}
                  className={`flex-1 rounded-full py-1 text-xs font-semibold transition-all duration-200 ${
                    weight === w ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
                  }`}
                >
                  {w === 250 ? '250г' : '1кг'}
                </button>
              ))}
            </div>
          )}

          {(<>
          <div className="mt-1.5 flex gap-1 rounded-full p-0.5 transition-colors duration-300" style={{ backgroundColor: switchBg }}>
            <button
              onClick={e => selectGrind(e, 'whole')}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all duration-200 ${
                effectiveGrind === 'whole' ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
              }`}
            >
              {t('grind_whole')}
            </button>

            <div className="group relative flex-1">
              <button
                onClick={e => selectGrind(e, 'ground')}
                disabled={groundDisabled}
                className={`w-full rounded-full py-1.5 text-xs font-semibold transition-all duration-200 ${
                  groundDisabled
                    ? 'cursor-not-allowed text-[#6E6D68] opacity-40'
                    : effectiveGrind === 'ground' ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
                }`}
              >
                {t('grind_ground')}
              </button>

              {groundDisabled && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-xs text-[#3A2115] opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
                  {t('grind_tooltip')}
                  <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/40 bg-white/70" />
                </div>
              )}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              showGrindOptions ? 'mt-1.5 max-h-40 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-nowrap gap-1 overflow-x-auto no-scrollbar">
              {GRIND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={e => selectGrindOption(e, opt.value)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${
                    grindOption === opt.value
                      ? 'border-[#412618] bg-[#412618] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#412618]'
                  }`}
                >
                  {t(`grind_${opt.value}`)}
                </button>
              ))}
            </div>
          </div>
          </>)}

          <div className="mt-auto flex items-center justify-between pt-1.5">
            <div className="flex flex-col">
              {isDiscounted && (
                <span className="text-xs line-through text-[#999]">{fmtPrice(product.old_price_1000!)}</span>
              )}
              <span className="text-base font-bold md:text-lg">{fmtPrice(displayPrice)}</span>
              {effectiveGrind === 'ground' && (
                <span className="text-[10px] text-gray-400">
                  {isBundle ? tb('bundle.grind_note', { price: GRIND_SURCHARGE, count: bundleCount }) : t('grind_surcharge')}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              aria-label={t('add_to_cart')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#412618] text-white transition hover:bg-[#4A2C1A] active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
