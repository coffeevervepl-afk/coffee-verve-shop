'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import type { Locale, ShopProduct } from '@/types/shop'
import { getProductName, getProductFlavorNotes, getProductImage, getProductPrice } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'

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
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)
  const [weight, setWeight]           = useState<250 | 1000>(250)
  const [grind, setGrind]             = useState<'whole' | 'ground'>('whole')
  const [grindOption, setGrindOption] = useState('espresso')

  const name   = getProductName(product, locale)
  const notes  = getProductFlavorNotes(product, locale)
  const image  = getProductImage(product)
  const basePrice = getProductPrice(product, weight)
  const has1kg = !!product.price_1000

  const isDiscounted      = weight === 1000 && !!product.old_price_1000 && product.old_price_1000 > basePrice
  const groundDisabled    = weight === 1000
  const effectiveGrind    = groundDisabled ? 'whole' : grind
  const showGrindOptions  = weight === 250 && grind === 'ground'
  const displayPrice      = effectiveGrind === 'ground' ? basePrice + GRIND_SURCHARGE : basePrice

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
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
    <Link href={`/${locale}/products/${product.slug}`} className="block group">
      <article className="card h-full min-w-[300px] flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-brand-border/30">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.is_featured && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
              Pick
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3 md:p-4">
          <h3 className="text-sm font-semibold leading-snug md:text-base">{name}</h3>
          {notes && (
            <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-brand-muted md:text-sm">{notes}</p>
          )}

          {product.body != null && product.acidity != null && (
            <div className="mb-4 mt-2 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] font-medium text-gray-600">{t('body')}</span>
                <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gray-800 transition-all duration-300" style={{ width: `${(product.body / 5) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] font-medium text-gray-600">{t('acidity')}</span>
                <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gray-800 transition-all duration-300" style={{ width: `${(product.acidity / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {has1kg && (
            <div className="mt-2 flex gap-2 rounded-xl bg-[#2C1810] p-1">
              {([250, 1000] as const).map(w => (
                <button
                  key={w}
                  onClick={e => selectWeight(e, w)}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                    weight === w ? 'bg-white text-[#2C1810]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {w === 250 ? '250г' : '1кг'}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-2 rounded-xl bg-[#2C1810] p-1">
            <button
              onClick={e => selectGrind(e, 'whole')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                effectiveGrind === 'whole' ? 'bg-white text-[#2C1810]' : 'text-white/70 hover:text-white'
              }`}
            >
              {t('grind_whole')}
            </button>

            <div className="group relative flex-1">
              <button
                onClick={e => selectGrind(e, 'ground')}
                disabled={groundDisabled}
                className={`w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                  groundDisabled
                    ? 'cursor-not-allowed text-white/70 opacity-40'
                    : effectiveGrind === 'ground' ? 'bg-white text-[#2C1810]' : 'text-white/70 hover:text-white'
                }`}
              >
                {t('grind_ground')}
              </button>

              {groundDisabled && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-lg bg-[#111110] px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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
            <div className="flex flex-wrap gap-1.5">
              {GRIND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={e => selectGrindOption(e, opt.value)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                    grindOption === opt.value
                      ? 'border-[#2C1810] bg-[#2C1810] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#2C1810]'
                  }`}
                >
                  {t(`grind_${opt.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex flex-col">
              {isDiscounted && (
                <span className="text-xs line-through text-[#999]">{fmtPrice(product.old_price_1000!)}</span>
              )}
              <span className="text-base font-bold md:text-lg">{fmtPrice(displayPrice)}</span>
              {effectiveGrind === 'ground' && (
                <span className="text-xs text-gray-400">{t('grind_surcharge')}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              aria-label={t('add_to_cart')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white transition hover:opacity-80 active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
