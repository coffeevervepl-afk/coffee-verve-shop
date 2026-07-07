'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/types/shop'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'pl', label: 'PL' },
  { code: 'ua', label: 'UA' },
]

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()

  // Replace /ru/... → /pl/...
  const localizedHref = (next: Locale) => {
    const segments = pathname.split('/')
    segments[1] = next
    return segments.join('/') || `/${next}`
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-brand-border p-0.5">
      {LOCALES.map(l => (
        <Link
          key={l.code}
          href={localizedHref(l.code)}
          className={`rounded-full px-2.5 py-1 text-[15px] font-semibold transition-all ${
            l.code === locale
              ? 'bg-brand-accent text-white'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}
