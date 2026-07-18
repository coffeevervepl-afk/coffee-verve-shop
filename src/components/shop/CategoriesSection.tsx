import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/types/shop'

const CATEGORIES = [
  { key: 'espresso', video: '/videos/espresso.mp4' },
  { key: 'filter',   video: '/videos/filter.mp4' },
  { key: 'decaf',    video: '/videos/decaf.mp4' },
] as const

interface Props {
  locale:   Locale
  // 'default' — big tiles (homepage). 'compact' — short landscape strip (/shop).
  variant?: 'default' | 'compact'
}

export default async function CategoriesSection({ locale, variant = 'default' }: Props) {
  const t = await getTranslations({ locale, namespace: 'categories' })
  const compact = variant === 'compact'

  const sectionCls = compact ? 'container' : 'container pb-8 md:pb-12'
  const gridCls    = compact ? 'grid grid-cols-3 gap-2 sm:gap-3' : 'grid grid-cols-1 gap-4 md:grid-cols-3'
  const tileCls    = compact ? 'h-[120px] rounded-xl md:h-[132px]' : 'h-72 rounded-2xl md:h-64'
  const padCls     = compact ? 'p-3 md:p-4' : 'p-6'
  const labelCls   = compact ? 'text-[10px] tracking-wide' : 'mb-1 text-xs tracking-wider'
  const titleCls   = compact ? 'text-sm leading-tight md:text-lg' : 'text-2xl'
  const arrowCls   = compact ? 'bottom-2.5 right-2.5 h-7 w-7' : 'bottom-6 right-6 h-9 w-9'
  const arrowSize  = compact ? 15 : 18

  return (
    <section className={sectionCls}>
      <div className={gridCls}>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.key}
            // Filter the /shop catalog by this category and jump to the grid.
            // (espresso/filter -> brew_method, decaf -> is_decaf.) Later: /shop/<cat>.
            href={`/${locale}/shop?category=${cat.key}#products-grid`}
            className={`group relative block overflow-hidden ${tileCls}`}
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

            {/* Dark overlay — strong at the top (text sits there). */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-transparent" />

            {/* Content */}
            <div className={`absolute top-0 left-0 text-white ${padCls}`}>
              <p className={`font-medium uppercase text-white/70 ${labelCls}`}>
                {t(`${cat.key}.label`)}
              </p>
              <h3 className={`font-bold uppercase ${titleCls}`}>{t(`${cat.key}.title`)}</h3>
              {!compact && <p className="mt-1 text-sm text-white/60">{t(`${cat.key}.count`)}</p>}
            </div>

            {/* Arrow */}
            <div className={`absolute flex items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-white/25 ${arrowCls}`}>
              <ArrowRight size={arrowSize} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
