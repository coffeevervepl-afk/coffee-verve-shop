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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: t('description') },
    { key: 'comments',    label: t('comments') },
    { key: 'recipes',     label: t('recipes') },
  ]

  return (
    <section className="container py-8 md:py-12">
      <div className="flex gap-6 overflow-x-auto border-b border-brand-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-shrink-0 whitespace-nowrap border-b-2 px-1 pb-3 text-sm transition-colors duration-200 md:text-base ${
              active === tab.key
                ? 'border-[#3A2115] font-semibold text-[#3A2115]'
                : 'border-transparent text-[#6E6D68] hover:text-[#3A2115]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {active === 'description' && <div>{t('description')}</div>}
        {active === 'comments' && <div>{t('comments')}</div>}
        {active === 'recipes' && <div>{t('recipes')}</div>}
      </div>
    </section>
  )
}
