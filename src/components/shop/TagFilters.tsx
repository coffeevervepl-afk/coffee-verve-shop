'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'
import { TAG_CHIPS, COLLAPSED_TAGS } from '@/lib/shopSlugs'
import CoffeeQuiz from '@/components/shop/CoffeeQuiz'

interface Props {
  locale:     Locale
  activeSlug: string | null   // current /shop/[tag] slug, if any
}

export default function TagFilters({ locale, activeSlug }: Props) {
  const t = useTranslations('shop')
  const [expanded, setExpanded] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const visible = expanded ? TAG_CHIPS : TAG_CHIPS.slice(0, COLLAPSED_TAGS)

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {/* Pearlescent shimmer chip — opens the 3-step coffee quiz. */}
      <button
        type="button"
        onClick={() => setQuizOpen(true)}
        className="quiz-shimmer rounded-full px-4 py-2 text-[14px] transition hover:brightness-[0.98]"
      >
        ✨ {t('tags.quiz')}
      </button>
      <CoffeeQuiz open={quizOpen} onClose={() => setQuizOpen(false)} locale={locale} />

      {/* Bundles — always-visible chip (own SEO page /shop/nabory). */}
      {(() => {
        const isActive = activeSlug === 'nabory'
        return (
          <Link
            href={isActive ? `/${locale}/shop` : `/${locale}/shop/nabory`}
            aria-pressed={isActive}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition ${
              isActive ? 'bg-[#412618] text-white' : 'bg-[#F4F3F0] text-[#3A2115] hover:bg-[#E9E7E1]'
            }`}
          >
            <span aria-hidden className={isActive ? 'text-white/50' : 'text-[#999]'}>#</span>
            {t('tags.nabory')}
          </Link>
        )
      })()}

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
          aria-expanded={expanded}
          className="group flex items-center gap-1.5 rounded-full bg-[#F4F3F0] px-4 py-2 text-[14px] font-medium text-[#3A2115] transition-all duration-150 hover:bg-[#E9E7E1]"
        >
          {expanded ? t('tags.less') : t('tags.more', { count: TAG_CHIPS.length - COLLAPSED_TAGS })}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            className={`text-[#412618] transition-transform duration-200 group-hover:translate-y-0.5 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}
