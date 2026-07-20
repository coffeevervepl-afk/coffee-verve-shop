'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import { getProductName, getProductImage } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import type { Locale, ShopProduct, ProductWeight } from '@/types/shop'

const MAX = 4
const PACK_WEIGHT = 250
const GRIND_SURCHARGE = 3
const GRIND_OPTIONS = ['espresso', 'aeropress', 'pourover', 'frenchpress', 'turka', 'moka'] as const

interface Props {
  products: ShopProduct[] // active single products
  locale:   Locale
}

export default function CustomBundleBuilder({ products, locale }: Props) {
  const t   = useTranslations('shop')
  const tp  = useTranslations('product')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)
  const [selected, setSelected]       = useState<ShopProduct[]>([])
  const [grind, setGrind]             = useState<'whole' | 'ground'>('whole')
  const [grindOption, setGrindOption] = useState('espresso')

  const count = selected.length
  const basePrice   = selected.reduce((s, p) => s + Number(p.price_250 || 0), 0)
  const surcharge   = grind === 'ground' ? GRIND_SURCHARGE * MAX : 0
  const displayPrice = basePrice + (count === MAX ? surcharge : 0)

  function toggle(p: ShopProduct) {
    setSelected(prev => {
      if (prev.some(x => x.id === p.id)) return prev.filter(x => x.id !== p.id)
      if (prev.length >= MAX) { toast(t('custom_bundle.max_reached')); return prev }
      return [...prev, p]
    })
  }

  function handleAdd() {
    if (count !== MAX) return
    add({
      product_id:  `custom-${crypto.randomUUID()}`,
      slug:        'custom-bundle',
      name:        t('custom_bundle.cart_name'),
      image:       getProductImage(selected[0]),
      weight:      (PACK_WEIGHT * MAX) as ProductWeight,
      grind,
      grindOption: grind === 'ground' ? grindOption : undefined,
      unit_price:  displayPrice,
      qty:         1,
      customBundle: {
        group_id: crypto.randomUUID(),
        items: selected.map(p => ({
          product_id: p.id,
          name:       getProductName(p, locale),
          price:      Number(p.price_250 || 0),
          weight:     PACK_WEIGHT,
        })),
      },
    })
    toast.success(`${t('custom_bundle.cart_name')} — ✓`)
    setSelected([])
    setGrind('whole')
    open()
  }

  if (products.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-[#3A2115] md:text-3xl">{t('custom_bundle.title')}</h2>
      <p className="mt-1 text-[15px] text-brand-muted">{t('custom_bundle.subtitle')}</p>

      {/* Sorts grid — mobile 2 cols, md+ 4 cols */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map(p => {
          const idx = selected.findIndex(x => x.id === p.id)
          const isSel = idx >= 0
          return (
            <button key={p.id} type="button" onClick={() => toggle(p)}
              className={`relative overflow-hidden rounded-xl border-2 bg-white p-2 text-left transition ${
                isSel ? 'border-[#3A2115]' : 'border-transparent hover:border-[#E8E7E3]'
              }`}>
              {isSel && (
                <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#3A2115] text-xs font-bold text-white">
                  {idx + 1}
                </span>
              )}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F4F3F0]">
                <Image src={getProductImage(p)} alt={getProductName(p, locale)} fill sizes="150px" className="object-cover" />
              </div>
              <p className="mt-1.5 truncate text-[13px] font-medium text-[#3A2115]">{getProductName(p, locale)}</p>
              <p className="text-[12px] text-brand-muted">{fmtPrice(Number(p.price_250 || 0))} / {PACK_WEIGHT}г</p>
            </button>
          )
        })}
      </div>

      {/* Total panel — normal block under the grid (not fixed) */}
      {count > 0 && (
        <div className="mt-6 rounded-2xl border border-[#E8E7E3] bg-white">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <span className="text-sm font-medium text-[#3A2115]">
              {t('custom_bundle.selected', { n: count })}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: MAX }).map((_, i) => (
                <span key={i} className={`h-3 w-3 rounded-full ${i < count ? 'bg-[#412618]' : 'border border-[#D8D3CC]'}`} />
              ))}
            </div>

            {/* Grind */}
            <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
              {(['whole', 'ground'] as const).map(g => (
                <button key={g} type="button" onClick={() => setGrind(g)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    grind === g ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
                  }`}>
                  {g === 'whole' ? tp('grind_whole') : tp('grind_ground')}
                </button>
              ))}
            </div>
            {grind === 'ground' && (
              <div className="flex flex-nowrap gap-1 overflow-x-auto no-scrollbar">
                {GRIND_OPTIONS.map(opt => (
                  <button key={opt} type="button" onClick={() => setGrindOption(opt)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      grindOption === opt ? 'border-[#412618] bg-[#412618] text-white' : 'border-gray-200 bg-white text-gray-600'
                    }`}>
                    {tp(`grind_${opt}`)}
                  </button>
                ))}
              </div>
            )}

            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-bold text-[#3A2115]">{fmtPrice(displayPrice)}</div>
                {grind === 'ground' && count === MAX && (
                  <div className="text-[10px] text-gray-400">
                    {t('custom_bundle.grind_note', { price: GRIND_SURCHARGE, count: MAX })}
                  </div>
                )}
              </div>
              <button type="button" onClick={handleAdd} disabled={count !== MAX}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  count === MAX ? 'bg-[#412618] text-white hover:bg-[#4A2C1A]' : 'cursor-not-allowed bg-[#E8E7E3] text-[#9CA3AF]'
                }`}>
                {count === MAX ? <><Plus size={16} />{t('custom_bundle.add_to_cart')}</> : t('custom_bundle.add_more', { n: MAX - count })}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
