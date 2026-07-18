import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getProducts } from '@/lib/supabase/products'
import CategoriesSection from '@/components/shop/CategoriesSection'
import ProductCard from '@/components/shop/ProductCard'
import TagFilters from '@/components/shop/TagFilters'
import { TAG_KEYS, TAG_FILTERS, brewMethods } from '@/lib/shopTags'
import type { Locale, ShopProduct } from '@/types/shop'

const CATEGORIES = ['espresso', 'filter', 'decaf'] as const
type Category = (typeof CATEGORIES)[number]

export async function generateMetadata(
  { params }: { params: { locale: Locale } },
): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'shop' })
  return { title: t('meta_title'), description: t('meta_description') }
}

// Default catalog order: sort_order ASC, then created_at DESC.
function byDefault(a: ShopProduct, b: ShopProduct): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

interface Props {
  params:       { locale: Locale }
  searchParams: { category?: string; tag?: string }
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = params
  const t  = await getTranslations({ locale, namespace: 'shop' })
  const tc = await getTranslations({ locale, namespace: 'categories' })

  const category: Category | null =
    (CATEGORIES as readonly string[]).includes(searchParams.category ?? '')
      ? (searchParams.category as Category)
      : null

  // Multi-select tags (AND logic), validated against the known set.
  const activeTags = (searchParams.tag ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(s => (TAG_KEYS as readonly string[]).includes(s))

  // Public catalog — reuse the homepage data layer (is_active only; shop_products
  // is publicly readable). Category + tag filtering applied in-memory (server side).
  const products = await getProducts()

  let list = products
  if (category === 'espresso')    list = list.filter(p => brewMethods(p).includes('espresso'))
  else if (category === 'filter') list = list.filter(p => brewMethods(p).includes('filter'))
  else if (category === 'decaf')  list = list.filter(p => p.is_decaf === true)
  for (const tag of activeTags) list = list.filter(TAG_FILTERS[tag])
  list = [...list].sort(byDefault)

  return (
    <>
      {/* Breadcrumbs: Home > Catalog [> Category] */}
      <div className="container pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-brand-muted">
          <Link href={`/${locale}`} className="transition-colors hover:text-[#3A2115]">{t('breadcrumb_home')}</Link>
          <span aria-hidden>/</span>
          {category ? (
            <>
              <Link href={`/${locale}/shop`} className="transition-colors hover:text-[#3A2115]">{t('breadcrumb_catalog')}</Link>
              <span aria-hidden>/</span>
              <span className="text-[#3A2115]">{tc(`${category}.label`)}</span>
            </>
          ) : (
            <span className="text-[#3A2115]">{t('breadcrumb_catalog')}</span>
          )}
        </nav>
      </div>

      {/* Compact category strip (video tiles) — links to ?category=<key> */}
      <div className="pt-5">
        <CategoriesSection locale={locale} variant="compact" />
      </div>

      {/* Product grid (with the tag filter row above it) */}
      <section id="products-grid" className="container scroll-mt-24 pb-16 pt-7 md:pb-24 md:pt-8">
        <TagFilters locale={locale} category={category} activeTags={activeTags} />

        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold md:text-3xl">
            {category ? tc(`${category}.title`) : t('title')}
          </h1>
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
