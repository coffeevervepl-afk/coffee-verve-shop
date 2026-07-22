import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SHOP_SLUGS } from '@/lib/shopSlugs'

const BASE = 'https://coffeeverve.pl'
const LOCALES = ['pl', 'ru', 'ua'] as const
// hreflang codes — Ukrainian route is /ua but the language code is "uk".
const HREFLANG: Record<(typeof LOCALES)[number], string> = { pl: 'pl', ru: 'ru', ua: 'uk' }

// Regenerate at most hourly so newly-activated products appear without a rebuild.
export const revalidate = 3600

type Freq = 'weekly' | 'monthly'

// One entry per locale for a given path; all three share the same hreflang set.
function entriesFor(
  path: string,
  opts: { lastModified: Date; changeFrequency: Freq; priority: number },
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map(l => [HREFLANG[l], `${BASE}/${l}${path}`]),
  )
  return LOCALES.map(l => ({
    url: `${BASE}/${l}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }))
}

async function getActiveProducts(): Promise<
  { slug: string; updated_at: string | null; created_at: string }[]
> {
  try {
    // Anon client (no cookies) — shop_products is publicly readable; keeps the
    // sitemap statically cacheable and never touches the service-role key.
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await sb
      .from('shop_products')
      .select('slug, updated_at, created_at')
      .eq('is_active', true)
      .not('slug', 'is', null)
    return data ?? []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const products = await getActiveProducts()

  return [
    ...entriesFor('',          { lastModified: now, changeFrequency: 'weekly', priority: 1.0 }),
    ...entriesFor('/shop',     { lastModified: now, changeFrequency: 'weekly', priority: 0.9 }),
    ...entriesFor('/referral', { lastModified: now, changeFrequency: 'monthly', priority: 0.6 }),
    ...SHOP_SLUGS.flatMap(s =>
      entriesFor(`/shop/${s.slug}`, { lastModified: now, changeFrequency: 'weekly', priority: 0.8 }),
    ),
    ...products.flatMap(p =>
      entriesFor(`/products/${p.slug}`, {
        lastModified: new Date(p.updated_at ?? p.created_at ?? now),
        changeFrequency: 'weekly',
        priority: 0.7,
      }),
    ),
  ]
}
