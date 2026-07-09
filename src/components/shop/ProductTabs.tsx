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
      <div className="w-full rounded-3xl border border-white/40 bg-[rgba(255,255,255,0.6)] p-3.5 shadow-sm backdrop-blur-md md:p-4">
        <div className="grid grid-cols-3 gap-2 border-b border-[#E8E7E3] pb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`rounded-[14px] px-4 py-1.5 text-center text-[12px] font-medium transition-colors duration-200 ${
                active === tab.key
                  ? 'bg-white/70 font-semibold text-[#3A2115] shadow-sm backdrop-blur-sm'
                  : 'text-[#6E6D68] hover:bg-[#F0E9E0]'
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
