import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getProducts } from '@/lib/supabase/products'
import { createServerSupabase } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import type { Locale, ShopProduct } from '@/types/shop'

const TABS = ['all', 'featured', 'new', 'popular'] as const
type Tab = (typeof TABS)[number]

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
function byNewest(a: ShopProduct, b: ShopProduct): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

interface Props {
  params:       { locale: Locale }
  searchParams: { tab?: string }
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: 'shop' })

  // Public page — no auth redirect. getUser only decides the guest promo.
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const showPromo = !user

  const products = await getProducts()   // all active, sort_order ASC (reused)
  const totalCount = products.length

  const tab: Tab = (TABS as readonly string[]).includes(searchParams.tab ?? '')
    ? (searchParams.tab as Tab)
    : 'all'

  let list: ShopProduct[]
  switch (tab) {
    case 'featured':
      list = products.filter(p => p.is_featured).sort(byDefault)
      break
    case 'new':
      list = [...products].sort(byNewest)
      break
    case 'popular':
      // TODO: replace with an aggregate over shop_order_items once sales accrue.
      list = products.filter(p => p.is_featured).sort(byDefault)
      break
    default:
      list = [...products].sort(byDefault)
  }

  const promoCell = (
    <div
      key="promo"
      className="flex h-full flex-col justify-center rounded-[20px] bg-[#3A2115] p-6 text-white"
    >
      <p className="text-lg font-semibold leading-snug">{t('promo_title')}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{t('promo_text')}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/account/register`}
          className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#3A2115] transition hover:bg-white/90"
        >
          {t('promo_register')}
        </Link>
        <Link
          href={`/${locale}/account/login`}
          className="rounded-full border border-white/40 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10"
        >
          {t('promo_login')}
        </Link>
      </div>
    </div>
  )

  const cells: React.ReactNode[] = list.map((p, i) => (
    <div
      key={p.id}
      className="animate-fade-up"
      style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
    >
      <ProductCard product={p} locale={locale} />
    </div>
  ))
  // Guest promo occupies one grid cell, right after the 3rd card
  // (or at the end when there are fewer than 3 products).
  if (showPromo && list.length > 0) {
    cells.splice(Math.min(3, cells.length), 0, promoCell)
  }

  return (
    <div className="container py-10 md:py-14">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t('title')}</h1>
        <span className="text-sm text-brand-muted">{t('count', { count: totalCount })}</span>
      </div>

      {/* Sort tabs — server-side via ?tab= (SEO / shareable) */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(tk => (
          <Link
            key={tk}
            href={tk === 'all' ? `/${locale}/shop` : `/${locale}/shop?tab=${tk}`}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              tab === tk
                ? 'bg-[#3A2115] text-white'
                : 'bg-black/5 text-[#4A4540] hover:bg-black/10'
            }`}
          >
            {t(`tab_${tk}`)}
          </Link>
        ))}
      </div>

      {/* Grid or empty state */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-brand-border p-16 text-center text-brand-muted">
          <p className="mb-4 text-5xl">☕</p>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cells}
        </div>
      )}
    </div>
  )
}
