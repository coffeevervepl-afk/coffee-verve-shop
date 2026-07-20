'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductName } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import type { Locale, ShopProduct, ProductWeight } from '@/types/shop'

const GRIND_SURCHARGE = 3
const GRIND_OPTIONS = ['espresso', 'aeropress', 'pourover', 'frenchpress', 'turka', 'moka'] as const

interface Props {
  product: ShopProduct
  locale:  Locale
}

// Full-width horizontal card for /shop/nabory: bundle header + a row of the
// component sorts (photo + name), then the grind selector and add-to-cart.
export default function BundleCard({ product, locale }: Props) {
  const t  = useTranslations('product')
  const tb = useTranslations('shop')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)
  const [grind, setGrind]             = useState<'whole' | 'ground'>('whole')
  const [grindOption, setGrindOption] = useState('espresso')

  const name        = getProductName(product, locale)
  const items       = product.bundle_items ?? []
  const packCount   = items.length
  const unitWeight  = items[0]?.weight ?? 250
  const totalWeight = items.reduce((s, b) => s + (b.weight || 0), 0)
  const bundlePrice = Number(product.price_250)
  const surcharge   = GRIND_SURCHARGE * packCount
  const displayPrice = bundlePrice + (grind === 'ground' ? surcharge : 0)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    add({
      product_id:  product.id,
      slug:        product.slug,
      name,
      image:       items[0]?.image || '/images/placeholder.jpg',
      weight:      (totalWeight || 1000) as ProductWeight,
      grind,
      grindOption: grind === 'ground' ? grindOption : undefined,
      unit_price:  displayPrice,
      qty:         1,
    })
    toast.success(`${name} — добавлено`)
    open()
  }

  return (
    <div className="rounded-2xl border border-[#E8E7E3] bg-white p-6">
      {/* Header: badge + name (left) · composition + price (right) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-[#3A2115] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {tb('bundle.badge')}
          </span>
          <h3 className="mt-1.5 text-xl font-semibold text-[#3A2115] md:text-2xl">
            <Link href={`/${locale}/products/${product.slug}`} className="hover:underline">{name}</Link>
          </h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-brand-muted">
            {tb('bundle.composition', { count: packCount, weight: unitWeight, total: totalWeight })}
          </div>
          <div className="text-xl font-bold text-[#3A2115]">{fmtPrice(displayPrice)}</div>
        </div>
      </div>

      {/* Component sorts — mobile: horizontal scroll; md+: 4-up grid */}
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar md:grid md:grid-cols-4">
        {items.map((c, i) => (
          <div key={c.product_id + i} className="w-[150px] shrink-0 md:w-auto">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F4F3F0]">
              {c.image ? (
                <Image src={c.image} alt={c.name} fill sizes="150px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#8A7A66]">
                  Coffee Verve
                </div>
              )}
            </div>
            <p className="mt-1.5 truncate text-[13px] font-medium text-[#3A2115]" title={c.name}>{c.name}</p>
            <p className="text-[11px] text-brand-muted">{c.weight}г</p>
          </div>
        ))}
      </div>

      {/* Controls: grind toggle + degree · price/note + add */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
          {(['whole', 'ground'] as const).map(g => (
            <button key={g} type="button" onClick={() => setGrind(g)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                grind === g ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
              }`}>
              {g === 'whole' ? t('grind_whole') : t('grind_ground')}
            </button>
          ))}
        </div>

        {grind === 'ground' && (
          <div className="flex max-w-full flex-nowrap gap-1 overflow-x-auto no-scrollbar">
            {GRIND_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => setGrindOption(opt)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  grindOption === opt ? 'border-[#412618] bg-[#412618] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#412618]'
                }`}>
                {t(`grind_${opt}`)}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-[#3A2115]">{fmtPrice(displayPrice)}</div>
            {grind === 'ground' && (
              <div className="text-[10px] text-gray-400">
                {tb('bundle.grind_note', { price: GRIND_SURCHARGE, count: packCount })}
              </div>
            )}
          </div>
          <button type="button" onClick={handleAdd} aria-label={t('add_to_cart')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#412618] text-white transition hover:bg-[#4A2C1A] active:scale-95">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
