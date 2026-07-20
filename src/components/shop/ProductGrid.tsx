'use client'
import type { Locale, ShopProduct } from '@/types/shop'
import ProductCard from './ProductCard'

interface Props {
  products: ShopProduct[]
  locale:   Locale
}

export default function ProductGrid({ products, locale }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <div
          key={p.id}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <ProductCard product={p} locale={locale} />
        </div>
      ))}
    </div>
  )
}
