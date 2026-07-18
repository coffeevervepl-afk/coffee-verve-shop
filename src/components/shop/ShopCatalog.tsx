import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getProducts } from '@/lib/supabase/products'
import CategoriesSection from '@/components/shop/CategoriesSection'
import ProductCard from '@/components/shop/ProductCard'
import TagFilters from '@/components/shop/TagFilters'
import { SLUG_MAP } from '@/lib/shopSlugs'
import type { Locale, ShopProduct } from '@/types/shop'

// Default catalog order: sort_order ASC, then created_at DESC.
function byDefault(a: ShopProduct, b: ShopProduct): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

interface Props {
  locale:     Locale
  activeSlug: string | null   // null => /shop (all products)
}

// Shared catalog body for /shop and every /shop/[tag] landing page.
export default async function ShopCatalog({ locale, activeSlug }: Props) {
  const t = await getTranslations({ locale, namespace: 'shop' })

  const def = activeSlug ? SLUG_MAP[activeSlug] : null
  const heading = def ? t(`seo.${def.key}.h1`) : t('title')

  const products = await getProducts()
  let list = def ? products.filter(def.filter) : products
  list = [...list].sort(byDefault)

  return (
    <>
      {/* Breadcrumbs: Home > Catalog [> tag] */}
      <div className="container pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-brand-muted">
          <Link href={`/${locale}`} className="transition-colors hover:text-[#3A2115]">{t('breadcrumb_home')}</Link>
          <span aria-hidden>/</span>
          {def ? (
            <>
              <Link href={`/${locale}/shop`} className="transition-colors hover:text-[#3A2115]">{t('breadcrumb_catalog')}</Link>
              <span aria-hidden>/</span>
              <span className="text-[#3A2115]">{heading}</span>
            </>
          ) : (
            <span className="text-[#3A2115]">{t('breadcrumb_catalog')}</span>
          )}
        </nav>
      </div>

      {/* Compact category strip (video tiles) — link to /shop/<category> */}
      <div className="pt-5">
        <CategoriesSection locale={locale} variant="compact" />
      </div>

      {/* Product grid (with the tag filter row above it) */}
      <section id="products-grid" className="container scroll-mt-24 pb-16 pt-7 md:pb-24 md:pt-8">
        <TagFilters locale={locale} activeSlug={activeSlug} />

        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold md:text-3xl">{heading}</h1>
          <span className="text-sm text-brand-muted">{t('count', { count: list.length })}</span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-brand-border p-16 text-center text-brand-muted">
            <p className="mb-4 text-5xl">☕</p>
            <p>{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <ProductCard product={p} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
