'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

interface Props {
  locale:     Locale
  isEmpty:    boolean
  emptyState: ReactNode
  children:   ReactNode   // product-card grid items
}

// Sidebar (guest promo) + product grid. Guest -> 280px sidebar + 2-col grid;
// logged-in -> no sidebar, 3-col grid (more products). Mobile (<md) -> no
// sidebar, 1-col grid, compact promo strip for guests.
export default function CatalogLayout({ locale, isEmpty, emptyState, children }: Props) {
  const t = useTranslations('shop')
  // Assume guest for the first paint (matches SSR); flip to false once the
  // session resolves. Avoids a hydration mismatch (initial state === SSR).
  const [guest, setGuest] = useState(true)

  useEffect(() => {
    let active = true
    createClient().auth.getUser().then(({ data }) => {
      if (active) setGuest(!data.user)
    })
    return () => { active = false }
  }, [])

  const gridCls =
    `grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2${guest ? '' : ' lg:grid-cols-3'}`

  return (
    <div className="md:flex md:gap-6">
      {guest && (
        <aside className="hidden md:block md:w-[280px] md:shrink-0">
          <div className="sticky top-20">
            <div className="rounded-2xl bg-[#3A2115] p-6 text-white">
              <h3 className="text-[20px] font-bold leading-tight">{t('promo.title')}</h3>
              <p className="mt-2 text-sm text-white/70">{t('promo.subtitle')}</p>
              <Link
                href={`/${locale}/account/login`}
                className="mt-4 block rounded-lg bg-white py-2.5 text-center font-bold text-[#3A2115] transition hover:bg-white/90"
              >
                {t('promo.login')}
              </Link>
              <Link
                href={`/${locale}/account/register`}
                className="mt-2 block rounded-lg border border-white/80 py-2.5 text-center font-bold text-white transition hover:bg-white/10"
              >
                {t('promo.register')}
              </Link>
              <p className="mt-4 text-[11px] text-white/80">{t('promo.loyalty')}</p>
            </div>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {/* Mobile-only compact promo strip (guests) */}
        {guest && (
          <Link
            href={`/${locale}/account/login`}
            className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#3A2115] px-4 py-3 text-sm font-semibold text-white md:hidden"
          >
            <span>{t('promo.mobile')}</span>
            <span aria-hidden>→</span>
          </Link>
        )}

        {isEmpty ? emptyState : <div className={gridCls}>{children}</div>}
      </div>
    </div>
  )
}
