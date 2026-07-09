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

  return (
    <section className="w-full py-8 md:py-12">
      <div className="w-full rounded-3xl border border-white/40 bg-[rgba(255,255,255,0.6)] p-6 shadow-sm backdrop-blur-md md:p-8">
        <div className="grid grid-cols-3 gap-3 border-b border-[#E8E7E3] pb-4 md:gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`rounded-full px-4 py-3 text-center text-base font-semibold transition-colors duration-200 md:py-4 md:text-xl ${
                active === tab.key
                  ? 'bg-[#3A2115] text-white'
                  : 'text-[#6E6D68] hover:bg-[#F0E9E0] hover:text-[#3A2115]'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tab.label}
                {tab.count != null && <span className="opacity-70">({tab.count})</span>}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-6">
          {active === 'description' && (
            <p className="py-4 text-center text-sm text-[#6E6D68]">{t('description_placeholder')}</p>
          )}
          {active === 'comments' && (
            <p className="py-4 text-center text-sm text-[#6E6D68]">{t('comments_placeholder')}</p>
          )}
          {active === 'recipes' && (
            <p className="py-4 text-center text-sm text-[#6E6D68]">{t('recipes_placeholder')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
