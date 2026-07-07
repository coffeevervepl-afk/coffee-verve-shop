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
          className={`rounded-full px-2 py-1 text-[13px] transition-all duration-150 hover:text-[#2C1810] hover:font-semibold ${
            l.code === locale
              ? 'text-[#2C1810] font-bold'
              : 'text-[#B8B7B2] font-normal'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}
