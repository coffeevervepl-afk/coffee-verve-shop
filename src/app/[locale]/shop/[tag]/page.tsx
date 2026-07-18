import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import ShopCatalog from '@/components/shop/ShopCatalog'
import { SHOP_SLUGS, SLUG_MAP } from '@/lib/shopSlugs'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale; tag: string }
}

const LOCALES: Locale[] = ['ru', 'pl', 'ua']

// One indexable page per slug × locale. (This project renders /[locale] dynamically
// — no parent generateStaticParams — so we enumerate the locale dimension here.)
export function generateStaticParams() {
  return LOCALES.flatMap(locale => SHOP_SLUGS.map(s => ({ locale, tag: s.slug })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = SLUG_MAP[params.tag]
  if (!def) return {}
  const t = await getTranslations({ locale: params.locale, namespace: 'shop' })
  return {
    title:       t(`seo.${def.key}.title`),
    description: t(`seo.${def.key}.description`),
    alternates:  { canonical: `/${params.locale}/shop/${def.slug}` },
  }
}

export default function ShopTagPage({ params }: Props) {
  // Unknown slug → 404 (never fall back to showing all products).
  if (!SLUG_MAP[params.tag]) notFound()
  return <ShopCatalog locale={params.locale} activeSlug={params.tag} />
}
