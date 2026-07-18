import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ShopCatalog from '@/components/shop/ShopCatalog'
import type { Locale } from '@/types/shop'

export async function generateMetadata(
  { params }: { params: { locale: Locale } },
): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'shop' })
  return { title: t('meta_title'), description: t('meta_description') }
}

// /shop — full catalog (no filter). Per-tag pages live at /shop/[tag].
export default function ShopPage({ params }: { params: { locale: Locale } }) {
  return <ShopCatalog locale={params.locale} activeSlug={null} />
}
