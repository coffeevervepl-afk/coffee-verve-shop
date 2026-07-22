import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getProducts } from '@/lib/supabase/products'
import SubscriptionPage from '@/components/shop/SubscriptionPage'
import type { Locale } from '@/types/shop'

interface Props { params: { locale: Locale } }

// Reads cookies via getProducts → rendered per request (not prerendered at build).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'subscription' })
  return {
    title:       { absolute: t('seo_title') },
    description: t('seo_description'),
    alternates:  { canonical: `/${params.locale}/shop/subskrypcja` },
  }
}

export default async function SubscriptionRoute({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: 'subscription' })
  const products = (await getProducts()).filter(p => p.product_type !== 'bundle')

  const faq = t.raw('faq') as { q: string; a: string }[]
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <SubscriptionPage products={products} locale={params.locale} />
    </>
  )
}
