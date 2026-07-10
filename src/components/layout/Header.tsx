'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Heart, ShoppingBag, User, MessageCircle, Send, Mail } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import type { Locale } from '@/types/shop'

const ROW1_TEXT = 'text-[13px] font-medium tracking-[0.02em] text-[#3A2115]'
const ROW2_LINK = 'text-[14px] font-semibold uppercase tracking-[0.04em] text-[#3A2115] transition-opacity hover:opacity-70'
const DROPDOWN   = 'absolute right-0 top-[calc(100%+10px)] z-20 rounded-[12px] bg-[rgba(255,255,255,0.85)] text-[#3A2115] shadow-lg backdrop-blur-md transition-all duration-200'

export default function Header({ locale }: { locale: Locale }) {
  const t      = useTranslations('nav')
  const tTop   = useTranslations('topbar')
  const router = useRouter()
  const count    = useCartStore(s => s.count)
  const openCart = useCartStore(s => s.openDrawer)
  const { user, signOut } = useAuth()

  const [contactsOpen, setContactsOpen] = useState(false)
  const contactsRef = useRef<HTMLDivElement | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) setContactsOpen(false)
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSignOut() {
    await signOut()
    setAccountOpen(false)
    router.push(`/${locale}`)
  }

  const firstName = user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : user?.email?.split('@')[0] ?? ''

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1360px]">

        {/* Row 1 — service bar */}
        <div className="hidden items-center justify-between border-b border-black/[0.06] px-6 py-[6px] md:flex">
          <LanguageSwitcher locale={locale} />

          <div className="flex items-center gap-4">
            <div ref={contactsRef} className="relative">
              <button type="button" onClick={() => setContactsOpen(v => !v)} className={ROW1_TEXT}>
                {tTop('contacts')}
              </button>
              <div className={`${DROPDOWN} w-56 p-3 ${
                contactsOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
              }`}>
                <a href="https://wa.me/48XXXXXXXXXX" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href="https://t.me/coffeeverve" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <Send size={16} /> Telegram
                </a>
                <a href="mailto:info@coffeeverve.pl" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <Mail size={16} /> info@coffeeverve.pl
                </a>
              </div>
            </div>

            <span className="h-3.5 w-px bg-black/15" />

            {!user ? (
              <>
                <Link href={`/${locale}/account/login`} className={ROW1_TEXT}>{t('login')}</Link>
                <span className="h-3.5 w-px bg-black/15" />
                <Link href={`/${locale}/account/register`} className={ROW1_TEXT}>{t('register')}</Link>
              </>
            ) : (
              <div ref={accountRef} className="relative">
                <button type="button" onClick={() => setAccountOpen(v => !v)} className={`flex items-center gap-1 ${ROW1_TEXT}`}>
                  {firstName} <span aria-hidden>▾</span>
                </button>
                <div className={`${DROPDOWN} min-w-[190px] p-1 ${
                  accountOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                }`}>
                  <Link href={`/${locale}/account`} onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-[13px] hover:bg-black/5">{t('my_account')}</Link>
                  <Link href={`/${locale}/account/orders`} onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-[13px] hover:bg-black/5">{t('my_orders')}</Link>
                  <Link href={`/${locale}/account/profile`} onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-[13px] hover:bg-black/5">{t('profile')}</Link>
                  <div className="my-1 border-t border-black/10" />
                  <button type="button" onClick={handleSignOut} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50">{t('logout')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 — main navigation */}
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-8">
            <Link href={`/${locale}`}>
              <Image src="/logo.png" alt="Coffee Verve" width={72} height={72} className="h-[72px] w-auto" />
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <Link href={`/${locale}`} className={ROW2_LINK}>
                {t('catalog')} <span aria-hidden>▾</span>
              </Link>
              <Link href="#reviews" className={ROW2_LINK}>{t('reviews')}</Link>
              <Link href="#delivery" className={ROW2_LINK}>{t('delivery_payment')}</Link>
              <a
                href="#b2b"
                className="flex items-center gap-1 text-[14px] font-semibold uppercase tracking-[0.04em] text-[#C47B2A] transition-opacity hover:opacity-70"
              >
                {tTop('b2b')}
                <span aria-hidden>↗</span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button aria-label={t('search')} className="btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text">
              <Search size={20} />
            </button>
            <button aria-label={t('wishlist')} className="btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text">
              <Heart size={20} />
            </button>

            {/* Mobile-only account entry point (row 1 is hidden below md) */}
            <Link
              href={user ? `/${locale}/account` : `/${locale}/account/login`}
              aria-label={t('my_account')}
              className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text md:hidden"
            >
              <User size={20} />
              {user && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-gold" />}
            </Link>

            <button
              onClick={openCart}
              aria-label={t('cart')}
              className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text"
            >
              <ShoppingBag size={20} />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
