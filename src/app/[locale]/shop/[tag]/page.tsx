import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import ShopCatalog from '@/components/shop/ShopCatalog'
import { SLUG_MAP } from '@/lib/shopSlugs'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale; tag: string }
}

// Rendered dynamically (like the rest of /[locale] in this app: next-intl runs
// without unstable_setRequestLocale and getProducts reads cookies). We deliberately
// DON'T use generateStaticParams — declaring these paths static made Next try to
// prerender them at build, which fails on those dynamic APIs. dynamicParams stays
// true, so any slug resolves on demand: known -> render, unknown -> notFound().
export const dynamicParams = true

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
