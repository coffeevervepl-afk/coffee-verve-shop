'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Heart, ShoppingBag, User, Phone, Mail } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

const ROW1_TEXT = 'text-[13px] font-medium tracking-[0.02em] text-[#3A2115]'
const ROW2_LINK = 'whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.04em] text-[#4A4540] transition-opacity hover:opacity-70'
const DROPDOWN   = 'absolute right-0 top-[calc(100%+10px)] z-20 rounded-[12px] bg-[rgba(255,255,255,0.85)] text-[#3A2115] shadow-lg backdrop-blur-md transition-all duration-200'
const NAV_CTA    = 'nav-cta-btn flex items-center gap-1 whitespace-nowrap rounded-full border border-white/40 bg-white/60 px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-[#4A4540] backdrop-blur-sm transition-colors hover:bg-white/80'

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  )
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.7 2.58-4.92 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.732-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.185.308-.263.582-.263 1.157v1.892h3.723l-.545 3.667h-3.178v7.98H9.101z" />
    </svg>
  )
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

// Social links shown inside the "Kontakt" popover (WhatsApp lives in the
// contact block above, so it's intentionally not repeated here).
const SOCIAL_MENU: { href: string; Icon: ({ size }: { size?: number }) => JSX.Element; color: string; label?: string; labelKey?: string }[] = [
  { href: 'https://www.instagram.com/coffee.verve',    Icon: InstagramIcon, color: '#E1306C', label: 'Instagram' },
  { href: 'https://www.tiktok.com/@coffeeverve',        Icon: TikTokIcon,    color: '#000000', label: 'TikTok' },
  { href: 'https://www.facebook.com/share/1BZXE3GTod/', Icon: FacebookIcon,  color: '#1877F2', label: 'Facebook' },
  { href: 'https://t.me/coffeeverve_shop',              Icon: TelegramIcon,  color: '#229ED9', labelKey: 'telegram_channel' },
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
  const { user, signOut, refresh } = useAuth()

  const [contactsOpen, setContactsOpen] = useState(false)
  const contactsRef = useRef<HTMLDivElement | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const catalogRef = useRef<HTMLDivElement | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string | null>(null)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) setContactsOpen(false)
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false)
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) setCatalogOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    const sb = createClient()
    async function loadSessionName() {
      const { data } = await sb.auth.getSession()
      const sessEmail = data.session?.user?.email ?? null
      setSessionEmail(sessEmail)
      if (sessEmail) {
        // Same source as /account: shop_users.name keyed by the current
        // auth user's email — so the header reflects an edited profile name
        // instead of a name derived from the email local-part.
        const { data: row } = await sb.from('shop_users').select('name').eq('email', sessEmail).single()
        setSessionName(row?.name?.trim() || null)
      }
    }
    loadSessionName()

    // Re-read the name after the profile is edited elsewhere (e.g. the account
    // page's ProfileCard) so the header doesn't keep showing the stale name.
    function onProfileUpdated() {
      loadSessionName()
      refresh()
    }
    window.addEventListener('shop-user-updated', onProfileUpdated)
    return () => window.removeEventListener('shop-user-updated', onProfileUpdated)
  }, [refresh])

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

          {/* center intentionally empty — social links moved into the Kontakt popover */}
          <div className="justify-self-center" />

          <div className="flex items-center justify-end gap-4 justify-self-end">
            <div ref={contactsRef} className="relative">
              <button type="button" onClick={() => setContactsOpen(v => !v)} className={ROW1_TEXT}>
                {tTop('contacts')}
              </button>
              <div className={`${DROPDOWN} w-64 p-3 ${
                contactsOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
              }`}>
                <a href="tel:+48573994584" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <span className="flex shrink-0" style={{ color: '#2BA84A' }}><Phone size={16} /></span> +48 573 994 584
                </a>
                <a href="https://wa.me/48573994584" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <span className="flex shrink-0" style={{ color: '#25D366' }}><WhatsAppIcon size={16} /></span> WhatsApp
                </a>
                <a href="https://t.me/Coffeeverve_pl" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <span className="flex shrink-0" style={{ color: '#229ED9' }}><TelegramIcon size={16} /></span> Telegram
                </a>
                <a href="mailto:info@coffeeverve.pl" className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5">
                  <span className="flex shrink-0" style={{ color: '#D9542B' }}><Mail size={16} /></span> info@coffeeverve.pl
                </a>

                <div className="my-1.5 border-t border-black/10" />
                <div className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8A7F72]">
                  {tTop('social')}
                </div>
                {SOCIAL_MENU.map(({ href, Icon, color, label, labelKey }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5"
                  >
                    <span className="flex shrink-0" style={{ color }}><Icon size={16} /></span> {label ?? tTop(labelKey!)}
                  </a>
                ))}
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
                  {sessionName ? sessionName.split(/\s+/)[0] : getDisplayName(sessionEmail)} <span aria-hidden>▾</span>
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
              {/* "Wybierz kawę" — main catalog entry: plain nav-link style
                  (ROW2_LINK) + shared pulse (nav-cta-btn). Click toggles the
                  category dropdown — same click-to-open + click-outside pattern
                  as the Kontakt/account menus. inline-flex so the pulse's scale
                  transform applies and the ▾ aligns. */}
              <div ref={catalogRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCatalogOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={catalogOpen}
                  className={`${ROW2_LINK} nav-cta-btn inline-flex items-center gap-1`}
                >
                  {t('catalog')} <span aria-hidden>▾</span>
                </button>
                <div
                  role="menu"
                  className={`absolute left-0 top-[calc(100%+10px)] z-20 min-w-[240px] rounded-[12px] bg-[rgba(255,255,255,0.85)] p-2 text-[#3A2115] shadow-lg backdrop-blur-md transition-all duration-200 ${
                    catalogOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                  }`}
                >
                  <Link href={`/${locale}/shop`} role="menuitem" onClick={() => setCatalogOpen(false)} className="block whitespace-nowrap rounded-lg px-4 py-3 text-[16px] font-semibold hover:bg-black/5">{t('menu_coffee')}</Link>
                  {/* TODO: dedicated sets route/filter once the bundles range exists */}
                  <Link href="#products" role="menuitem" onClick={() => setCatalogOpen(false)} className="block whitespace-nowrap rounded-lg px-4 py-3 text-[16px] font-semibold hover:bg-black/5">{t('menu_sets')}</Link>
                  {/* Same target as the existing "Subskrypcja kawy" nav item */}
                  <Link href="#subscription" role="menuitem" onClick={() => setCatalogOpen(false)} className="block whitespace-nowrap rounded-lg px-4 py-3 text-[16px] font-semibold hover:bg-black/5">{t('subscription')}</Link>
                  {/* TODO: replace with the B2B section page once it's ready */}
                  <Link href="#products" role="menuitem" onClick={() => setCatalogOpen(false)} className="block whitespace-nowrap rounded-lg px-4 py-3 text-[16px] font-semibold hover:bg-black/5">{t('menu_office')}</Link>
                </div>
              </div>
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
