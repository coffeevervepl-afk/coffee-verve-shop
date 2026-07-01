'use client'
import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/types/shop'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'pl', label: 'PL' },
  { code: 'ua', label: 'UA' },
]

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const router   = useRouter()

  const switchLocale = (next: Locale) => {
    // Replace /ru/... → /pl/...
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-brand-border p-0.5">
      {LOCALES.map(l => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
            l.code === locale
              ? 'bg-brand-accent text-white'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
