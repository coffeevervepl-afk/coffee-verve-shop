'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/hooks/useCartStore'
import { fmtPrice } from '@/lib/pricing'
import type { Locale } from '@/types/shop'

const PREVIEW_LIMIT = 3
const OPEN_DELAY_MS = 200

export default function CartPreview({ locale }: { locale: Locale }) {
  const t          = useTranslations('cart')
  const tNav       = useTranslations('nav')
  const items      = useCartStore(s => s.items)
  const count      = useCartStore(s => s.count)
  const openDrawer = useCartStore(s => s.openDrawer)

  const [previewOpen, setPreviewOpen] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    if (openTimer.current) clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setPreviewOpen(true), OPEN_DELAY_MS)
  }

  function handleLeave() {
    if (openTimer.current) clearTimeout(openTimer.current)
    setPreviewOpen(false)
  }

  const visibleItems = items.slice(0, PREVIEW_LIMIT)
  const extraCount   = items.length - PREVIEW_LIMIT

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        onClick={openDrawer}
        aria-label={tNav('cart')}
        className="relative btn-ghost rounded-full p-2 text-brand-muted hover:text-brand-text"
      >
        <ShoppingBag size={20} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+8px)] hidden w-80 rounded-xl border border-brand-border bg-brand-surface p-3 shadow-xl transition-all duration-150 md:block ${
          previewOpen ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-1'
        }`}
      >
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">{t('empty')}</p>
        ) : (
          <>
            <ul className="space-y-3">
              {visibleItems.map(item => (
                <li key={`${item.product_id}-${item.weight}`} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-border/20">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-muted">
                        <ShoppingBag size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-brand-muted">{item.weight}g × {item.qty}</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold">
                    {fmtPrice(item.unit_price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>

            {extraCount > 0 && (
              <p className="mt-2 text-center text-xs text-brand-muted">
                {t('more_items', { count: extraCount })}
              </p>
            )}

            <Link
              href={`/${locale}/checkout`}
              className="btn btn-primary mt-3 w-full text-sm"
            >
              {t('checkout')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
