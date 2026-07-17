import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/types/shop'

const CATEGORIES = [
  { key: 'espresso', video: '/videos/espresso.mp4', brew: 'espresso' },
  { key: 'filter',   video: '/videos/filter.mp4',   brew: 'filter' },
  // Decaf is a product TYPE, not a brew method. There's no decaf filter yet
  // (the `caffeine` product field is free-text and unused for filtering), so
  // this tile temporarily links to the homepage catalog instead of a brew query.
  // TODO: point at a real decaf filter once a /shop listing route exists.
  { key: 'decaf',    video: '/videos/decaf.mp4',    brew: null },
] as const

export default async function CategoriesSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'categories' })

  return (
    <section className="container pb-8 md:pb-12">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.key}
            href={cat.brew ? `/${locale}/shop?brew=${cat.brew}` : '#products'}
            className="group relative block h-72 overflow-hidden rounded-2xl md:h-64"
          >
            {/* Fallback background if the video fails to load */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2C1810] to-[#111110]" />

            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              src={cat.video}
            />

            {/* Dark overlay — kept strong at the top for text legibility (text
                sits up there), lighter through the middle so bright videos
                aren't dimmed. */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-transparent" />

            {/* Content */}
            <div className="absolute top-0 left-0 p-6 text-white">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/70">
                {t(`${cat.key}.label`)}
              </p>
              <h3 className="text-2xl font-bold uppercase">{t(`${cat.key}.title`)}</h3>
              <p className="mt-1 text-sm text-white/60">{t(`${cat.key}.count`)}</p>
            </div>

            {/* Arrow */}
            <div className="absolute bottom-6 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-white/25">
              <ArrowRight size={18} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
