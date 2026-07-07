'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Search, User } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import type { Locale } from '@/types/shop'

export default function Navbar({ locale }: { locale: Locale }) {
  const t        = useTranslations('nav')
  const router   = useRouter()
  const count    = useCartStore(s => s.count)
  const openCart = useCartStore(s => s.openDrawer)
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    router.push(`/${locale}`)
  }

  const firstName = user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : user?.email?.split('@')[0] ?? ''

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

          {!user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/${locale}/account/login`}
                className="px-2 py-1 text-sm text-[var(--gray-700)] hover:text-brand-text transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/account/register`}
                className="rounded-md border border-brand-border px-[14px] py-[6px] text-sm text-[var(--gray-700)] hover:text-brand-text transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          ) : (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-1 px-2 py-1 text-sm text-[var(--gray-700)] hover:text-brand-text transition-colors"
              >
                <span>{firstName}</span>
                <span>▾</span>
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+8px)] min-w-[190px] rounded-md border border-brand-border bg-brand-surface p-1 transition-all duration-150 ${
                  menuOpen ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1'
                }`}
              >
                <Link
                  href={`/${locale}/account`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded px-3 py-2 text-sm text-brand-text hover:bg-brand-border/20"
                >
                  {t('my_account')}
                </Link>
                <Link
                  href={`/${locale}/account/orders`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded px-3 py-2 text-sm text-brand-text hover:bg-brand-border/20"
                >
                  {t('my_orders')}
                </Link>
                <Link
                  href={`/${locale}/account/profile`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded px-3 py-2 text-sm text-brand-text hover:bg-brand-border/20"
                >
                  {t('profile')}
                </Link>
                <div className="my-1 border-t border-brand-border" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          )}

          <Link
            href={user ? `/${locale}/account` : `/${locale}/account/login`}
            aria-label={t('my_account')}
            className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text md:hidden"
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
