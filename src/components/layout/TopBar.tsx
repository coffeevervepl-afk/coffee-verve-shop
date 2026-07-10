'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Truck, MessageCircle, Send, Mail } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import type { Locale } from '@/types/shop'

const TEXT = 'text-[12px] font-medium tracking-[0.02em] text-[#3A2115]'
const SEPARATOR = <span className="h-3.5 w-px shrink-0 bg-black/15" />

export default function TopBar({ locale }: { locale: Locale }) {
  const t    = useTranslations('topbar')
  const tNav = useTranslations('nav')
  const [contactsOpen, setContactsOpen] = useState(false)
  const contactsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!contactsRef.current) return
      if (!contactsRef.current.contains(event.target as Node)) setContactsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="w-full border-b border-brand-border bg-brand-surface/80 backdrop-blur-md">
      <div className="container flex items-center justify-between px-6 py-[10px]">

        {/* Left */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
          {SEPARATOR}
          <span className={`flex items-center gap-1.5 ${TEXT}`}>
            <Truck size={14} />
            {t('delivery')}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <a
            href="#b2b"
            className="flex items-center gap-1 text-[12px] font-semibold tracking-[0.02em] text-[#C47B2A] transition-opacity hover:opacity-80"
          >
            {t('b2b')}
            <span aria-hidden>↗</span>
          </a>

          {SEPARATOR}

          <div ref={contactsRef} className="relative">
            <button
              type="button"
              onClick={() => setContactsOpen(v => !v)}
              className={TEXT}
            >
              {t('contacts')}
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+10px)] z-20 w-56 rounded-[12px] bg-[rgba(255,255,255,0.85)] p-3 text-[#3A2115] shadow-lg backdrop-blur-md transition-all duration-200 ${
                contactsOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0'
              }`}
            >
              <a
                href="https://wa.me/48XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a
                href="https://t.me/coffeeverve"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5"
              >
                <Send size={16} /> Telegram
              </a>
              <a
                href="mailto:info@coffeeverve.pl"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-black/5"
              >
                <Mail size={16} /> info@coffeeverve.pl
              </a>
            </div>
          </div>

          {SEPARATOR}

          <Link href={`/${locale}/account/login`} className={TEXT}>
            {tNav('login')}
          </Link>

          {SEPARATOR}

          <Link href={`/${locale}/account/register`} className={TEXT}>
            {tNav('register')}
          </Link>
        </div>
      </div>
    </div>
  )
}
