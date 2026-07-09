'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Locale, ShopProduct } from '@/types/shop'

type TabKey = 'description' | 'comments' | 'recipes'

interface Props {
  product: ShopProduct
  locale:  Locale
}

export default function ProductTabs({ product, locale }: Props) {
  const t = useTranslations('product_tabs')
  const [active, setActive] = useState<TabKey>('description')

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'description', label: t('description') },
    { key: 'comments',    label: t('comments') },
    { key: 'recipes',     label: t('recipes') },
  ]

  const fields = [
    { key: 'origin',   labelKey: 'origin',   value: product.origin },
    { key: 'process',  labelKey: 'process',  value: product.process },
    { key: 'roast',    labelKey: 'roast',    value: product.roast_level },
    { key: 'brew',     labelKey: 'brew',     value: product.brew_method },
    { key: 'altitude', labelKey: 'altitude', value: product.altitude },
    { key: 'variety',  labelKey: 'variety',  value: product.variety },
    { key: 'sca',      labelKey: 'sca',      value: product.sca_score?.toString() },
    { key: 'caffeine', labelKey: 'caffeine', value: product.caffeine },
    { key: 'roaster',  labelKey: 'roaster',  value: product.roaster },
  ].filter(f => f.value)

  const desc = locale === 'ru' ? product.description_ru
             : locale === 'pl' ? product.description_pl
             : product.description_ua

  return (
    <section className="w-full mt-8 md:mt-10 pb-8 md:pb-12">
      {/* Zone 1: tab track */}
      <div className="w-full rounded-2xl bg-[#F4EEE6] p-2">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`rounded-xl px-4 py-4 text-center text-base md:text-lg font-medium transition-colors duration-200 ${
                active === tab.key
                  ? 'bg-white font-semibold text-[#3A2115] shadow-sm'
                  : 'text-[#6E6D68] hover:bg-white/40'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tab.label}
                {tab.count != null && <span className="opacity-70">({tab.count})</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Zone 2: content */}
      <div className="w-full mt-4 rounded-2xl border border-[#E8E7E3] bg-[#F7F6F4] p-6">
        {active === 'description' && (
          <>
            {fields.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6E6D68]">{t('details_title')}</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {fields.map(f => (
                    <div key={f.key}>
                      <p className="mb-0.5 text-xs text-[#6E6D68]">{t(f.labelKey)}</p>
                      <p className="text-sm font-medium text-[#3A2115]">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {desc && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6E6D68]">{t('description_title')}</p>
                <p className="text-sm leading-relaxed text-[#3A2115]">{desc}</p>
              </div>
            )}
            {!fields.length && !desc && (
              <p className="py-4 text-center text-sm text-[#6E6D68]">{t('description_placeholder')}</p>
            )}
          </>
        )}
        {active === 'comments' && (
          <p className="py-4 text-center text-sm text-[#6E6D68]">{t('comments_placeholder')}</p>
        )}
        {active === 'recipes' && (
          <p className="py-4 text-center text-sm text-[#6E6D68]">{t('recipes_placeholder')}</p>
        )}
      </div>
    </section>
  )
}
