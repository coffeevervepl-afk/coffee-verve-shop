'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'
import { TAG_CHIPS, COLLAPSED_TAGS } from '@/lib/shopSlugs'

interface Props {
  locale:     Locale
  activeSlug: string | null   // current /shop/[tag] slug, if any
}

export default function TagFilters({ locale, activeSlug }: Props) {
  const t = useTranslations('shop')
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? TAG_CHIPS : TAG_CHIPS.slice(0, COLLAPSED_TAGS)

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {/* Pearlescent shimmer chip — placeholder for a future quiz; for now it
          just scrolls to the grid. */}
      <Link
        href="#products-grid"
        className="quiz-shimmer rounded-full px-4 py-2 text-[14px] transition hover:brightness-[0.98]"
      >
        ✨ {t('tags.quiz')}
      </Link>

      {visible.map(({ slug, chip }) => {
        const isActive = slug === activeSlug
        // Each chip is its own indexable page; the active chip clears the filter.
        const href = isActive ? `/${locale}/shop` : `/${locale}/shop/${slug}`
        return (
          <Link
            key={slug}
            href={href}
            aria-pressed={isActive}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition ${
              isActive
                ? 'bg-[#412618] text-white'
                : 'bg-[#F4F3F0] text-[#3A2115] hover:bg-[#E9E7E1]'
            }`}
          >
            <span aria-hidden className={isActive ? 'text-white/50' : 'text-[#999]'}>#</span>
            {t(`tags.${chip}`)}
          </Link>
        )
      })}

      {TAG_CHIPS.length > COLLAPSED_TAGS && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="rounded-full px-3 py-2 text-[14px] font-medium text-[#8A7A66] transition-colors hover:text-[#4A4540]"
        >
          {expanded ? `${t('tags.less')} ▲` : `${t('tags.more')} ▼`}
        </button>
      )}
    </div>
  )
}
