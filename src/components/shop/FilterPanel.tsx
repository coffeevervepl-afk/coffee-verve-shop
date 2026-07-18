'use client'
import { useTranslations } from 'next-intl'
import type { ShopProduct } from '@/types/shop'
import { FILTER_GROUPS, optionCount } from '@/lib/shopFilters'

interface Props {
  products: ShopProduct[]
  selected: Set<string>
  onToggle: (id: string) => void
  onReset:  () => void
}

export default function FilterPanel({ products, selected, onToggle, onReset }: Props) {
  const t = useTranslations('shop')

  return (
    <div>
      {FILTER_GROUPS.map((g, gi) => (
        <div key={g.id} className={gi > 0 ? 'mt-5 border-t border-[#E8E7E3] pt-5' : ''}>
          <h4 className="mb-3 text-[15px] font-bold uppercase tracking-[0.05em] text-[#3A2115]">
            {t(`filters.${g.titleKey}`)}
          </h4>
          <div className="flex flex-col gap-2.5">
            {g.options.map(o => {
              const n = optionCount(products, g, o, selected)
              const checked = selected.has(o.id)
              const dim = n === 0 && !checked
              return (
                <label key={o.id}
                       className={`flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-[#3A2115] ${dim ? 'opacity-40' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(o.id)}
                         className="h-4 w-4 shrink-0 accent-[#3A2115]" />
                  <span>
                    {t(`filters.${o.labelKey}`)}{' '}
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
