'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Heart, ShoppingBag, User, Phone, MessageCircle, Send, Mail, Instagram, Facebook, Music } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

const ROW1_TEXT = 'text-[13px] font-medium tracking-[0.02em] text-[#3A2115]'
const ROW2_LINK = 'whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.04em] text-[#4A4540] transition-opacity hover:opacity-70'
const DROPDOWN   = 'absolute right-0 top-[calc(100%+10px)] z-20 rounded-[12px] bg-[rgba(255,255,255,0.85)] text-[#3A2115] shadow-lg backdrop-blur-md transition-all duration-200'
const NAV_CTA    = 'nav-cta-btn flex items-center gap-1 whitespace-nowrap rounded-full border border-white/40 bg-white/60 px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[#4A4540] backdrop-blur-sm transition-colors hover:bg-white/80'

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/coffee.verve',        icon: Instagram,      color: '#E1306C', label: 'Instagram' },
  { href: 'https://www.tiktok.com/@coffeeverve',            icon: Music,          color: '#000000', label: 'TikTok' },
  { href: 'https://www.facebook.com/share/1BZXE3GTod/',     icon: Facebook,       color: '#1877F2', label: 'Facebook' },
  { href: 'https://wa.me/48573994584',                      icon: MessageCircle,  color: '#25D366', label: 'WhatsApp' },
  { href: 'https://t.me/coffeeverve_shop',                  icon: Send,           color: '#229ED9', label: 'Telegram' },
]

function getDisplayName(email: string): string {
  const namePart = email.split('@')[0].split('.')[0].replace(/[0-9]/g, '')
  if (!namePart) return email.split('@')[0]
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase()
}

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
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) setContactsOpen(false)
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user?.email ?? null))
  }, [])

  async function handleSignOut() {
    await signOut()
    setAccountOpen(false)
    router.push(`/${locale}`)
  }

  async function handleSessionSignOut() {
    const sb = createClient()
    await sb.auth.signOut()
    setAccountOpen(false)
    window.location.href = `/${locale}`
  }

  const firstName = user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : user?.email?.split('@')[0] ?? ''

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1360px]">

        {/* Row 1 — service bar */}
        <div className="relative z-10 hidden grid-cols-3 items-center border-b border-black/[0.06] px-6 py-[6px] md:grid">
          <div className="justify-self-start">
            <LanguageSwitcher locale={locale} />
          </div>

          <div className="flex items-center justify-center gap-3 justify-self-center">
            {SOCIAL_LINKS.map(({ href, icon: Icon, color, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-[28px] w-[28px] items-center justify-center transition-opacity hover:opacity-80"
              >
                <Icon size={16} color={color} />
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 justify-self-end">
            <div ref={contactsRef} className="relative">
              <button type="button" onClick={() => setContactsOpen(v => !v)} className={ROW1_TEXT}>
                {tTop('contacts')}
              </button>
              <div className={`${DROPDOWN} w-56 p-3 ${
                contactsOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
              }`}>
                <a href="tel:+48573994584" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <Phone size={16} /> +48 573 994 584
                </a>
                <a href="https://wa.me/48573994584" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href="https://t.me/Coffeeverve_pl" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <Send size={16} /> Telegram
                </a>
                <a href="mailto:info@coffeeverve.pl" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <Mail size={16} /> info@coffeeverve.pl
                </a>
              </div>
            </div>

            <span className="h-3.5 w-px bg-black/15" />

            {!user && !sessionEmail ? (
              <>
                <Link href={`/${locale}/account/login`} className={ROW1_TEXT}>{t('login')}</Link>
                <span className="h-3.5 w-px bg-black/15" />
                <Link href={`/${locale}/account/register`} className={ROW1_TEXT}>{t('register')}</Link>
              </>
            ) : !user && sessionEmail ? (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex cursor-pointer items-center gap-1 text-[14px] font-medium text-[#3A2115] transition-colors hover:text-[#2A2620]"
                >
                  {getDisplayName(sessionEmail)} <span aria-hidden>▾</span>
                </button>
                <div className={`${DROPDOWN} min-w-[190px] p-1 ${
                  accountOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                }`}>
                  <Link href={`/${locale}/account`} onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-[13px] hover:bg-black/5">{t('my_cabinet')}</Link>
                  <button type="button" onClick={handleSessionSignOut} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50">{t('logout')}</button>
                </div>
              </div>
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
        <div className="flex h-[64px] items-center justify-between overflow-visible px-6">
          <div className="flex items-center gap-8">
            <Link href={`/${locale}`}>
              <Image src="/logo.png" alt="Coffee Verve" width={120} height={120} className="-my-8 h-[120px] w-auto" />
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <Link href={`/${locale}`} className={ROW2_LINK}>
                {t('catalog')} <span aria-hidden>▾</span>
              </Link>
              <Link href="#reviews" className={ROW2_LINK}>{t('reviews')}</Link>
              <Link href="#delivery" className={ROW2_LINK}>{t('delivery_payment')}</Link>
              <Link href="#subscription" className={NAV_CTA}>
                {t('subscription')}
              </Link>
              <a href="#b2b" className={NAV_CTA}>
                {tTop('b2b')}
                <span aria-hidden>↗</span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button aria-label={t('search')} className="flex h-10 w-10 items-center justify-center rounded-full text-[#3A2115] transition-opacity duration-150 hover:opacity-60">
              <Search size={24} strokeWidth={1.5} />
            </button>
            <button aria-label={t('wishlist')} className="flex h-10 w-10 items-center justify-center rounded-full text-[#3A2115] transition-opacity duration-150 hover:opacity-60">
              <Heart size={24} strokeWidth={1.5} />
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#3A2115] transition-opacity duration-150 hover:opacity-60"
            >
              <ShoppingBag size={24} strokeWidth={1.5} />
              <span className="absolute right-0 top-0 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-brand-accent px-1 text-[11px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
