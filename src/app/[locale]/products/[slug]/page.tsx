import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProductBySlug, getProductName, getProductDescription, getProductFlavorNotes, getProductImage, getProductPrice } from '@/lib/supabase/products'
import type { Locale, ProductWeight } from '@/types/shop'
import AddToCartSection from '@/components/shop/AddToCartSection'
import { fmtPrice } from '@/lib/pricing'

interface Props { params: { locale: Locale; slug: string } }

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = params
  const t       = await getTranslations({ locale, namespace: 'product' })
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const name  = getProductName(product, locale)
  const desc  = getProductDescription(product, locale)
  const notes = getProductFlavorNotes(product, locale)
  const image = getProductImage(product)

  const weights: { w: ProductWeight; label: string }[] = [
    { w: 250,  label: '250g' },
    ...(product.price_500  ? [{ w: 500  as ProductWeight, label: '500g' }] : []),
    ...(product.price_1000 ? [{ w: 1000 as ProductWeight, label: '1 kg' }] : []),
  ]

  const roastLabel: Record<string, string> = {
    light: t('roast_light'), medium: t('roast_medium'),
    'medium-dark': t('roast_medium_dark'), dark: t('roast_dark'),
  }

  return (
    <div className="container py-8 md:py-16">
      <div className="grid gap-8 md:grid-cols-2 md:gap-16">

        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-border/20">
            <Image
              src={image}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0,4).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-brand-border/20">
                  <Image src={img} alt={`${name} ${i+1}`} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.origin && (
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-gold">
              {product.origin}
            </p>
          )}
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{name}</h1>

          {notes && (
            <p className="mb-6 text-brand-muted">{notes}</p>
          )}

          {/* Attributes */}
          <div className="mb-6 flex flex-wrap gap-2">
            {product.roast_level && (
              <span className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-muted">
                {t('roast')}: {roastLabel[product.roast_level]}
              </span>
            )}
            {product.brew_method && (
              <span className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-muted">
                {t('brew')}: {product.brew_method}
              </span>
            )}
            {product.process && (
              <span className="rounded-full border border-brand-border px-3 py-1 text-xs text-brand-muted">
                {t('process')}: {product.process}
              </span>
            )}
          </div>

          {desc && (
            <p className="mb-8 leading-relaxed text-brand-muted">{desc}</p>
          )}

          {/* Add to cart (client) */}
          <AddToCartSection
            product={product}
            weights={weights}
            name={name}
            image={image}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
