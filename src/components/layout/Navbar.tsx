'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Search, User } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import type { Locale } from '@/types/shop'

export default function Navbar({ locale }: { locale: Locale }) {
  const t        = useTranslations('nav')
  const count    = useCartStore(s => s.count)
  const openCart = useCartStore(s => s.openDrawer)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-surface/80 backdrop-blur-md">
      <nav className="container flex h-14 items-center justify-between md:h-16">

        {/* Logo */}
        <Link href={`/${locale}`} className="font-bold text-brand-accent text-lg tracking-tight">
          Coffee Verve
        </Link>

        {/* Center links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          <Link href={`/${locale}`} className="text-sm text-brand-muted hover:text-brand-text transition-colors">
            {t('catalog')}
          </Link>
          <Link href={`/${locale}/about`} className="text-sm text-brand-muted hover:text-brand-text transition-colors">
            {t('about')}
          </Link>
        </div>

        {/* Right: lang + search + cart */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />

          <button
            aria-label={t('search')}
            className="btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text"
          >
            <Search size={20} />
          </button>

          <Link
            href={user ? `/${locale}/account` : `/${locale}/account/login`}
            aria-label="Личный кабинет"
            className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text"
          >
            <User size={20} />
            {user && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-gold" />
            )}
          </Link>

          <button
            onClick={openCart}
            aria-label={t('cart')}
            className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}
