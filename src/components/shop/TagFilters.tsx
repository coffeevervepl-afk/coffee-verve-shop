'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'
import { TAG_KEYS } from '@/lib/shopTags'

const COLLAPSED = 4   // show first N, rest behind "ещё ▼"

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
  const visible = expanded ? TAG_KEYS : TAG_KEYS.slice(0, COLLAPSED)

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {/* Highlighted "pick coffee in a minute" chip — placeholder for a future
          quiz; for now it just scrolls to the grid. */}
      <Link
        href="#products-grid"
        className="rounded-full bg-gradient-to-r from-[#B8791F] to-[#8A5A1A] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
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
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
              isActive
                ? 'bg-[#412618] text-white'
                : 'bg-[#F4F3F0] text-[#4A4540] hover:bg-[#E9E7E1]'
            }`}
          >
            {t(`tags.${key}`)}
          </Link>
        )
      })}

      {TAG_KEYS.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="rounded-full px-3 py-2 text-[13px] font-medium text-[#8A7A66] transition-colors hover:text-[#4A4540]"
        >
          {expanded ? `${t('tags.less')} ▲` : `${t('tags.more')} ▼`}
        </button>
      )}
    </div>
  )
}
