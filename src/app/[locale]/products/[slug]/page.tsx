import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProductBySlug } from '@/lib/supabase/products'
import { getProductName, getProductDescription, getProductFlavorNotes, getProductImage, getProductPrice } from '@/lib/product-utils'
import type { Locale, ProductWeight } from '@/types/shop'
import AddToCartSection from '@/components/shop/AddToCartSection'
import ReviewsSection from '@/components/shop/reviews/ReviewsSection'
import GuaranteeBlock from '@/components/shop/GuaranteeBlock'
import { fmtPrice } from '@/lib/pricing'

interface Props {
  params:       { locale: Locale; slug: string }
  searchParams: { email?: string }
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, slug } = params
  const email = searchParams.email   // lightweight: passed via ?email= after checkout
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

  // Process localisation map (EN term → locale display name)
  const processLabel: Record<string, Record<Locale, string>> = {
    'Pulped Natural': { ru: 'Мёдовый процесс', pl: 'Proces miodowy',   ua: 'Медовий процес' },
    'Honey':          { ru: 'Мёдовый процесс', pl: 'Proces miodowy',   ua: 'Медовий процес' },
    'Natural':        { ru: 'Натуральный',      pl: 'Naturalny',         ua: 'Натуральний'    },
    'Washed':         { ru: 'Промытый',         pl: 'Płukany',           ua: 'Промитий'       },
    'Anaerobic':      { ru: 'Анаэробный',       pl: 'Anaerobowy',        ua: 'Анаеробний'     },
    'Wet-Hulled':     { ru: 'Влажный хулл',     pl: 'Wilgotne łuszczenie',ua:'Вологе лущення' },
  }

  const localizedProcess = (raw: string) =>
    processLabel[raw]?.[locale] ?? raw

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
          <h1 className="mb-4 text-5xl font-bold">{name}</h1>

          {notes && (
            <p className="mb-6 text-[22px] font-medium text-[#3D3C39]">{notes}</p>
          )}

          {/* Attributes */}
          <div className="mb-6 flex flex-wrap gap-2">
            {product.roast_level && (
              <span className="rounded-full border border-brand-border px-4 py-2 text-[19px] text-[#3D3C39]">
                {t('roast')}: {roastLabel[product.roast_level]}
              </span>
            )}
            {product.brew_method && (
              <span className="rounded-full border border-brand-border px-4 py-2 text-[19px] text-[#3D3C39]">
                {t('brew')}: {product.brew_method}
              </span>
            )}
            {product.process && (
              <span className="rounded-full border border-brand-border px-4 py-2 text-[19px] text-[#3D3C39]">
                {t('process')}: {localizedProcess(product.process)}
              </span>
            )}
          </div>

          {desc && (
            <p className="mb-8 text-[22px] leading-[1.7] text-brand-muted">{desc}</p>
          )}

          {/* Guarantee UTP — compact, below add to cart */}
          <div className="mt-4">
            <GuaranteeBlock compact />
          </div>

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

      {/* ── Reviews ─────────────────────────────────────────────────────── */}
      <ReviewsSection
        productId={product.id}
        locale={locale}
        email={email}
      />
    </div>
  )
}
