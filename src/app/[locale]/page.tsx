import { getTranslations } from 'next-intl/server'
import { getProducts } from '@/lib/supabase/products'
import type { Locale } from '@/types/shop'
import ProductGrid from '@/components/shop/ProductGrid'

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const t       = await getTranslations({ locale, namespace: 'home' })
  const products = await getProducts()

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="container py-16 md:py-24 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-gold">
          Coffee Verve · Warsaw
        </p>
        <h1 className="mb-4">{t('hero_title')}</h1>
        <p className="mx-auto max-w-md text-lg text-brand-muted">
          {t('hero_subtitle')}
        </p>
      </section>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <section className="container pb-24">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('catalog_title')}</h2>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-brand-border p-16 text-center text-brand-muted">
            <p className="text-5xl mb-4">☕</p>
            <p>Товары появятся совсем скоро</p>
          </div>
        ) : (
          <ProductGrid products={products} locale={locale} />
        )}
      </section>
    </div>
  )
}
