'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'
import { TAG_KEYS, COLLAPSED_TAGS } from '@/lib/shopTags'

interface Props {
  locale:     Locale
  category:   string | null
  activeTags: string[]
}

function buildHref(locale: string, category: string | null, tags: string[]): string {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (tags.length) params.set('tag', tags.join(','))
  const qs = params.toString()
  return `/${locale}/shop${qs ? `?${qs}` : ''}#products-grid`
}

export default function TagFilters({ locale, category, activeTags }: Props) {
  const t = useTranslations('shop')
  const [expanded, setExpanded] = useState(false)
  const active = new Set(activeTags)
  const visible = expanded ? TAG_KEYS : TAG_KEYS.slice(0, COLLAPSED_TAGS)

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

      {visible.map(key => {
        const isActive = active.has(key)
        const nextTags = isActive ? activeTags.filter(x => x !== key) : [...activeTags, key]
        return (
          <Link
            key={key}
            href={buildHref(locale, category, nextTags)}
            aria-pressed={isActive}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition ${
              isActive
                ? 'bg-[#412618] text-white'
                : 'bg-[#F4F3F0] text-[#3A2115] hover:bg-[#E9E7E1]'
            }`}
          >
            <span aria-hidden className={isActive ? 'text-white/50' : 'text-[#999]'}>#</span>
            {t(`tags.${key}`)}
          </Link>
        )
      })}

      {TAG_KEYS.length > COLLAPSED_TAGS && (
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
