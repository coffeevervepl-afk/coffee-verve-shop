'use client'
import { useState, useRef, useEffect } from 'react'
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
  const [tipOpen, setTipOpen]         = useState(false)
  const tipRef = useRef<HTMLDivElement>(null)

  // Mobile: close the info tooltip on tap outside (desktop uses hover).
  useEffect(() => {
    if (!tipOpen) return
    function onDoc(e: MouseEvent) {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) setTipOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [tipOpen])

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
      <div ref={tipRef} className="group/tip relative flex items-center gap-2">
        <h2 className="text-2xl font-semibold text-[#3A2115] md:text-3xl">{t('custom_bundle.title')}</h2>
        <button type="button" aria-label={t('custom_bundle.tip_title')}
                onClick={() => setTipOpen(o => !o)}
                className="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center text-[#8A7A66] transition-colors hover:text-[#3A2115]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M12 11.5v4.5" /><path d="M12 7.75h.01" />
          </svg>
        </button>
        <span role="tooltip"
              className={`absolute left-0 top-full z-40 mt-2 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/40 bg-white/75 p-5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-[16px] transition-all duration-200 ease-out opacity-0 -translate-y-1 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-hover/tip:pointer-events-auto group-focus-within/tip:opacity-100 group-focus-within/tip:translate-y-0 ${
                tipOpen ? '!opacity-100 !translate-y-0 !pointer-events-auto' : ''
              }`}>
          <span className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-l border-t border-white/40 bg-white/75" />
          <p className="text-[15px] font-semibold text-[#3A2115]">{t('custom_bundle.tip_title')}</p>
          <p className="mt-1.5 text-sm text-[#4B4B4B]">{t('custom_bundle.tip_text')}</p>
          <div className="mt-2.5 space-y-1 text-sm text-[#4B4B4B]">
            <p>{t('custom_bundle.tip_line1')}</p>
            <p>{t('custom_bundle.tip_line2')}</p>
            <p>{t('custom_bundle.tip_line3')}</p>
          </div>
        </span>
      </div>
      <p className="mt-1 text-[15px] text-brand-muted">{t('custom_bundle.subtitle')}</p>

      {/* Promo banner — same style as the product-page "login" promo (LoginDiscountHint) */}
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-[#F4F3F0] px-4 py-3.5 text-center sm:flex-row sm:text-left">
        <span className="text-3xl">🎁</span>
        <div>
          <p className="text-[15px] font-semibold">{t('custom_bundle.banner_title')}</p>
          <p className="text-[13px] text-[#6E6D68]">{t('custom_bundle.banner_guarantee')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 text-sm font-semibold">
          {count === MAX
            ? <span className="text-[#412618]">✓ {t('custom_bundle.complete')}</span>
            : <span className="text-[#3A2115]">{t('custom_bundle.progress', { n: count })}</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#412618] transition-[width] duration-300"
            style={{ width: `${(count / MAX) * 100}%` }}
          />
        </div>
      </div>

      {/* Sorts grid — mobile 2 cols, md+ 4 cols */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map(p => {
          const idx = selected.findIndex(x => x.id === p.id)
          const isSel = idx >= 0
          return (
            <div key={p.id} role="button" tabIndex={0} onClick={() => toggle(p)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p) } }}
              className={`relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 bg-white p-2 text-left transition ${
                isSel ? 'border-[#3A2115]' : 'border-transparent hover:border-[#E8E7E3]'
              }`}>
              {isSel && (
                <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/65 text-xs font-bold text-[#3A2115] shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-[10px]">
                  {idx + 1}
                </span>
              )}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F4F3F0]">
                <Image src={getProductImage(p)} alt={getProductName(p, locale)} fill sizes="150px" className="object-cover" />
              </div>
              <p className="mt-1.5 truncate text-[13px] font-medium text-[#3A2115]">{getProductName(p, locale)}</p>
              <p className="text-[12px] text-brand-muted">{fmtPrice(Number(p.price_250 || 0))} / {PACK_WEIGHT}г</p>
              <button type="button" onClick={e => { e.stopPropagation(); toggle(p) }}
                className={`mt-2 w-full rounded-full px-4 py-1.5 text-[13px] font-medium shadow-sm transition ${
                  isSel
                    ? 'bg-[#412618] text-white hover:bg-[#4A2C1A]'
                    : 'bundle-add-btn border border-[#E8E7E3] bg-white/70 text-[#3A2115] backdrop-blur-sm'
                }`}>
                {isSel ? `✓ ${t('custom_bundle.chosen')}` : t('custom_bundle.add')}
              </button>
            </div>
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
