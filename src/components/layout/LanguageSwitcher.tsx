'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/types/shop'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'pl', label: 'PL' },
  { code: 'ru', label: 'RU' },
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
    <div className="flex items-center gap-1">
      {LOCALES.map(l => (
        <Link
          key={l.code}
          href={localizedHref(l.code)}
          className={`rounded-full px-2 py-1 text-[13px] font-semibold transition-all ${
            l.code === locale
              ? 'text-brand-text'
              : 'text-[var(--gray-500)] hover:text-brand-text'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}
