import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import HeroHeadline from './HeroHeadline'
import type { Locale } from '@/types/shop'

export default async function HeroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'hero' })

  return (
    <section className="bg-gradient-to-b from-[#FAF7F2] to-white py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-medium text-brand-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-accent" />
            </span>
            {t('badge')}
          </div>

          <HeroHeadline
            title={t('title')}
            subtitle={t('subtitle')}
            guaranteeLabel={t('guarantee_link')}
          />

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="#products" className="btn btn-primary px-8">
              {t('cta_primary')}
            </Link>
            <Link href={`/${locale}/about`} className="btn btn-outline px-8">
              {t('cta_secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
