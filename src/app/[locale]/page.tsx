import { getTranslations } from 'next-intl/server'
import { getProducts, getFeaturedProducts } from '@/lib/supabase/products'
import type { Locale } from '@/types/shop'
import HeroSection from '@/components/shop/HeroSection'
import CategoriesSection from '@/components/shop/CategoriesSection'
import FeaturedCarousel from '@/components/shop/FeaturedCarousel'
import ProductGrid from '@/components/shop/ProductGrid'
import LeadCaptureBlock from '@/components/shop/LeadCaptureBlock'
import GuaranteeBlock from '@/components/shop/GuaranteeBlock'

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const t        = await getTranslations({ locale, namespace: 'home' })
  const [products, featuredProducts] = await Promise.all([
    getProducts(),
    getFeaturedProducts(),
  ])
  // Bundles have their own page (/shop/nabory) — keep them out of the general catalog.
  const catalogProducts  = products.filter(p => p.product_type !== 'bundle')
  const catalogFeatured  = featuredProducts.filter(p => p.product_type !== 'bundle')

  return (
    <div className="min-h-screen">
      <HeroSection locale={locale} />

      {/* ── Categories ───────────────────────────────────────────────── */}
      <CategoriesSection locale={locale} />

      {/* ── Featured / Рекомендуем ───────────────────────────────────── */}
      <FeaturedCarousel products={catalogFeatured} locale={locale} />

      {/* ── Lead capture (−10% first order) ──────────────────────────── */}
      <section className="container pb-8">
        <LeadCaptureBlock />
      </section>

      {/* ── Guarantee UTP ────────────────────────────────────────────── */}
      <section className="container pb-10">
        <GuaranteeBlock />
      </section>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <section id="products" className="container pb-24">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('catalog_title')}</h2>
        </div>

        {catalogProducts.length === 0 ? (
          <div className="rounded-2xl border border-brand-border p-16 text-center text-brand-muted">
            <p className="text-5xl mb-4">☕</p>
            <p>Товары появятся совсем скоро</p>
          </div>
        ) : (
          <ProductGrid products={catalogProducts} locale={locale} />
        )}
      </section>
    </div>
  )
}
