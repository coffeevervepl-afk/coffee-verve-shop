'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/shop/ProductCard'
import FilterPanel from '@/components/shop/FilterPanel'
import { filterProducts } from '@/lib/shopFilters'
import type { Locale, ShopProduct } from '@/types/shop'

interface Props {
  locale:   Locale
  products: ShopProduct[]   // already slug-filtered on the server
}

// Sidebar (guest promo + facet filters) + client-filtered product grid.
// Desktop: 280px sidebar (non-sticky) + 2-col grid. Mobile: no sidebar,
// "Фильтры" button opens a bottom sheet; 1-col grid.
export default function CatalogLayout({ locale, products }: Props) {
  const t = useTranslations('shop')
  const [guest, setGuest]         = useState(true)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    let active = true
    createClient().auth.getUser().then(({ data }) => { if (active) setGuest(!data.user) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sheetOpen])

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const reset = () => setSelected(new Set())

  const filtered = useMemo(() => filterProducts(products, selected), [products, selected])
  const activeCount = selected.size

  const emptyBox = (
    <div className="rounded-2xl border border-brand-border p-16 text-center text-brand-muted">
      <p className="mb-4 text-5xl">☕</p>
      <p>{t('empty')}</p>
    </div>
  )

  // Empty category → no sidebar, full-width message.
  if (products.length === 0) return emptyBox

  return (
    <div className="md:flex md:gap-4">
      {/* Desktop sidebar (non-sticky): promo for guests, then filters */}
      <aside className="hidden md:block md:w-[250px] md:shrink-0">
        {guest && (
          <div className="mb-5 rounded-2xl bg-[#3A2115] p-6 text-white">
            <h3 className="text-[20px] font-bold leading-tight">{t('promo.title')}</h3>
            <p className="mt-2 text-sm text-white/70">{t('promo.subtitle')}</p>
            <Link href={`/${locale}/account/login`}
                  className="mt-4 block rounded-lg bg-white py-2.5 text-center font-bold text-[#3A2115] transition hover:bg-white/90">
              {t('promo.login')}
            </Link>
            <Link href={`/${locale}/account/register`}
                  className="mt-2 block rounded-lg border border-white/80 py-2.5 text-center font-bold text-white transition hover:bg-white/10">
              {t('promo.register')}
            </Link>
            <p className="mt-4 text-[11px] text-white/80">{t('promo.loyalty')}</p>
          </div>
        )}
        <FilterPanel products={products} selected={selected} onToggle={toggle} onReset={reset} />
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile: guest promo strip + filters button */}
        {guest && (
          <Link href={`/${locale}/account/login`}
                className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-[#3A2115] px-4 py-3 text-sm font-semibold text-white md:hidden">
            <span>{t('promo.mobile')}</span>
            <span aria-hidden>→</span>
          </Link>
        )}
        <button type="button" onClick={() => setSheetOpen(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E7E3] py-2.5 text-sm font-semibold text-[#3A2115] md:hidden">
          {t('filters.mobile_filters')}{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>

        {filtered.length === 0 ? emptyBox : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <div key={p.id} className="animate-fade-up"
                   style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                <ProductCard product={p} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSheetOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#3A2115]">{t('filters.mobile_filters')}</h3>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label={t('quiz.close')}
                      className="text-xl leading-none text-[#8A7A66]">✕</button>
            </div>
            <FilterPanel products={products} selected={selected} onToggle={toggle} onReset={reset} />
            <button type="button" onClick={() => setSheetOpen(false)}
                    className="mt-5 w-full rounded-lg bg-[#3A2115] py-3 font-bold text-white">
              {t('filters.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
