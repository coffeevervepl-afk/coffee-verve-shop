import { getTranslations } from 'next-intl/server'
import HeroHeadline from './HeroHeadline'
import type { Locale } from '@/types/shop'

export default async function HeroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'hero' })

  return (
    <section className="bg-gradient-to-b from-[#FAF7F2] to-white py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-6xl text-center">
          <HeroHeadline
            title={t('title')}
            subtitle={t('subtitle')}
            guaranteeLabel={t('guarantee_link')}
          />
        </div>
      </div>
    </section>
  )
}
