'use client'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ShopProduct } from '@/types/shop'
import { getFilterGroups, optionCount } from '@/lib/shopFilters'

interface Props {
  products: ShopProduct[]
  selected: Set<string>
  onToggle: (id: string) => void
  onReset:  () => void
}

// ⓘ trigger + glassmorphism popup shown on hover/focus.
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group/tip relative ml-1.5 inline-flex align-middle">
      <button type="button" aria-label={text}
              className="flex h-4 w-4 items-center justify-center text-[#8A7A66] transition-colors hover:text-[#3A2115]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" /><path d="M12 11.5v4.5" /><path d="M12 7.75h.01" />
        </svg>
      </button>
      <span role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-[260px] max-w-[260px] translate-y-1 rounded-xl border border-white/60 bg-white/85 px-4 py-3 text-[13px] font-normal leading-snug text-[#3A2115] opacity-0 shadow-lg backdrop-blur-md transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-within/tip:translate-y-0 group-focus-within/tip:opacity-100">
        {text}
      </span>
    </span>
  )
}

export default function FilterPanel({ products, selected, onToggle, onReset }: Props) {
  const t = useTranslations('shop')
  const groups = useMemo(() => getFilterGroups(products), [products])

  return (
    <div>
      {groups.map((g, gi) => (
        <div key={g.id} className={gi > 0 ? 'mt-3 border-t border-[#E8E7E3] pt-4' : ''}>
          <h4 className="mb-3 flex items-center text-[16px] font-bold uppercase tracking-[0.05em] text-[#3A2115]">
            {t(`filters.${g.titleKey}`)}
            <InfoTooltip text={t(`filters.tooltip.${g.tooltipKey}`)} />
          </h4>
          <div className="flex flex-col gap-1.5">
            {g.options.map(o => {
              const n = optionCount(products, groups, g, o, selected)
              const checked = selected.has(o.id)
              const dim = n === 0 && !checked
              return (
                <label key={o.id}
                       className={`flex cursor-pointer items-center gap-2.5 text-[16px] font-medium text-[#3A2115] ${dim ? 'opacity-40' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(o.id)}
                         className="h-4 w-4 shrink-0 accent-[#3A2115]" />
                  <span>
                    {o.label ?? t(`filters.${o.labelKey}`)}{' '}
                    <span className="text-[#3A2115]/50">({n})</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {selected.size > 0 && (
        <button type="button" onClick={onReset}
                className="mt-5 w-full rounded-lg border border-[#E8E7E3] py-2 text-[14px] font-medium text-[#8A5A1A] transition hover:bg-[#F4F3F0]">
          {t('filters.reset')}
        </button>
      )}
    </div>
  )
}
