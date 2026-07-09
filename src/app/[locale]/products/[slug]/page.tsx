import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/supabase/products'
import { getProductName, getProductDescription, getProductFlavorNotes, getProductImage, getProductPrice } from '@/lib/product-utils'
import type { Locale, ProductWeight } from '@/types/shop'
import AddToCartSection from '@/components/shop/AddToCartSection'
import ProductGallery from '@/components/shop/ProductGallery'
import ReviewsSection from '@/components/shop/reviews/ReviewsSection'
import GuaranteeBlock from '@/components/shop/GuaranteeBlock'
import LoginDiscountHint from '@/components/shop/LoginDiscountHint'
import ProductTabs from '@/components/shop/ProductTabs'
import { fmtPrice } from '@/lib/pricing'
import { getFlavorColor } from '@/lib/flavorColors'

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

  const name     = getProductName(product, locale)
  const desc     = getProductDescription(product, locale)
  const notes    = getProductFlavorNotes(product, locale)
  const noteList = notes ? notes.split('•').map(n => n.trim()).filter(Boolean) : []
  const image    = getProductImage(product)

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
    <div className="container py-4 md:py-7">
      <div className="grid gap-5 md:grid-cols-2 md:gap-7">

        {/* Images */}
        <ProductGallery
          images={product.images.length ? product.images : [image]}
          name={name}
          video_url={product.video_url ?? undefined}
        />

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="mb-4 text-xl font-bold leading-tight md:text-2xl">{name}</h1>

          {notes && (
            <p className="mb-2.5 text-[19px] font-medium">
              {noteList.map((note, i) => (
                <span key={i}>
                  <span style={{ color: getFlavorColor(note).text }}>{note}</span>
                  {i < noteList.length - 1 && <span className="text-[#6E6D68]"> • </span>}
                </span>
              ))}
            </p>
          )}

          {/* Attributes */}
          <div className="mb-2.5 flex flex-wrap gap-2">
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
            <p className="mb-3.5 text-[22px] leading-[1.7] text-[#2D2D2D]">{desc}</p>
          )}

          {/* Guarantee UTP — compact, below add to cart */}
          <div className="mt-4">
            <GuaranteeBlock compact />
          </div>

          {/* Login discount hint — guests only */}
          <LoginDiscountHint />

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

      {/* ── Tabs (description / comments / recipes) ───────────────────────── */}
      <ProductTabs product={product} locale={locale} />

      {/* ── Reviews ─────────────────────────────────────────────────────── */}
      <ReviewsSection
        productId={product.id}
        locale={locale}
        email={email}
      />
    </div>
  )
}
