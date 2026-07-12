'use client'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import type { Locale, ShopProduct } from '@/types/shop'

interface Props {
  products: ShopProduct[]
  locale:   Locale
}

const CARD_GAP = 16

export default function FeaturedCarousel({ products, locale }: Props) {
  const t = useTranslations('home')
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  function scroll(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const cardWidth = card?.offsetWidth ?? el.clientWidth / 3
    el.scrollBy({ left: direction * (cardWidth + CARD_GAP), behavior: 'smooth' })
  }

  return (
    <section className="container pb-10">
      <h2 className="mb-6 text-2xl font-semibold">{t('featured')}</h2>

      <div className="group/carousel relative">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 p-2 opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 hover:bg-white/90 group-hover/carousel:opacity-100 md:flex"
        >
          <ChevronLeft size={20} className="text-[#3A2115]" />
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex flex-nowrap snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        >
          {products.map(p => (
            <div key={p.id} className="w-[78vw] shrink-0 snap-start md:w-[calc((100%-32px)/3)]">
              <ProductCard product={p} locale={locale} />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 hidden translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 p-2 opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 hover:bg-white/90 group-hover/carousel:opacity-100 md:flex"
        >
          <ChevronRight size={20} className="text-[#3A2115]" />
        </button>
      </div>
    </section>
  )
}
