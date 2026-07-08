import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/types/shop'

function renderAccentTitle(raw: string) {
  const match = raw.match(/^([\s\S]*)\[(.+)\]([\s\S]*)$/)
  if (!match) return raw
  const [, before, accent, after] = match
  return (
    <>
      {before}
      <span className="text-brand-accent">{accent}</span>
      {after}
    </>
  )
}

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

          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-6xl">
            {renderAccentTitle(t('title'))}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-brand-muted">
            {t('subtitle')}
          </p>

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
