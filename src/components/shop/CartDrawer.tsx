'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/hooks/useCartStore'
import { useAuth } from '@/hooks/useAuth'
import { fmtPrice } from '@/lib/pricing'
import type { PromoDiscount } from '@/lib/pricing'
import type { Locale } from '@/types/shop'
import PromoCodeField from './checkout/PromoCodeField'

const FREE_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? 150)

export default function CartDrawer() {
  const t          = useTranslations('cart')
  const tCheckout  = useTranslations('checkout')
  const params     = useParams()
  const locale     = (params.locale as Locale) ?? 'ru'
  const { user }   = useAuth()
  const drawerOpen = useCartStore(s => s.drawerOpen)
  const closeDrawer = useCartStore(s => s.closeDrawer)
  const items      = useCartStore(s => s.items)
  const count      = useCartStore(s => s.count)
  const updateQty  = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)
  const subtotal   = useCartStore(s => s.subtotal)
  const [promo, setPromo] = useState<PromoDiscount | null>(null)

  const total = subtotal()
  const promoDiscount = promo
    ? promo.type === 'percent' ? Math.round(total * promo.value) / 100 : Math.min(promo.value, total)
    : 0
  const discountedSubtotal = Math.round((total - promoDiscount) * 100) / 100
  const remaining = FREE_THRESHOLD - discountedSubtotal
  const isFreeDelivery = discountedSubtotal >= FREE_THRESHOLD

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col bg-brand-surface shadow-2xl sm:max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
              <h2 className="text-base font-semibold">
                {items.length > 0 ? t('title_count', { count }) : t('title')}
              </h2>
              <button onClick={closeDrawer} className="btn-ghost rounded-full p-2">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-brand-muted">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="text-sm">{t('empty')}</p>
                  <button onClick={closeDrawer} className="btn btn-outline text-sm">
                    {t('empty_cta')}
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map(item => (
                    <li key={`${item.product_id}-${item.weight}`} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-border/20">
                        <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-brand-muted">{item.weight}g</p>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-brand-border">
                            <button
                              onClick={() => updateQty(item.product_id, item.weight, item.qty - 1)}
                              className="flex h-6 w-6 items-center justify-center text-brand-muted hover:text-brand-text"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.product_id, item.weight, item.qty + 1)}
                              className="flex h-6 w-6 items-center justify-center text-brand-muted hover:text-brand-text"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold">
                            {fmtPrice(item.unit_price * item.qty)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id, item.weight)}
                        className="self-start text-brand-muted hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="space-y-4 border-t border-brand-border px-5 py-4">
                <div className="flex items-center gap-3 rounded-xl bg-brand-accent px-4 py-3 text-white">
                  <span className="text-xl leading-none">🔄</span>
                  <p className="text-xs font-medium leading-snug">{t('guarantee')}</p>
                </div>

                <PromoCodeField
                  email={user?.email ?? ''}
                  subtotal={total}
                  onApply={setPromo}
                  applied={promo}
                />

                {remaining > 0 && (
                  <div className="rounded-xl bg-brand-border/30 px-3 py-2 text-xs text-brand-muted">
                    {t('free_delivery_hint', { amount: fmtPrice(remaining) })}
                    <div className="mt-1.5 h-1 rounded-full bg-brand-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-gold transition-all"
                        style={{ width: `${Math.min(100, (discountedSubtotal / FREE_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-brand-muted">
                    <span>{tCheckout('subtotal')}</span>
                    <span>{fmtPrice(total)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-brand-muted">
                      <span>{tCheckout('discount')}</span>
                      <span>−{fmtPrice(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-brand-muted">
                    <span>{tCheckout('delivery_cost')}</span>
                    <span>
                      {isFreeDelivery ? tCheckout('free') : t('delivery_free_from', { amount: fmtPrice(FREE_THRESHOLD) })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-brand-border pt-1.5 text-base font-semibold text-brand-text">
                    <span>{tCheckout('total')}</span>
                    <span>{fmtPrice(discountedSubtotal)}</span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/checkout`}
                  onClick={closeDrawer}
                  className="btn btn-primary w-full text-base"
                >
                  {t('checkout')}
                </Link>

                <button
                  onClick={closeDrawer}
                  className="w-full text-center text-sm text-brand-muted underline-offset-2 hover:text-brand-text hover:underline"
                >
                  {t('continue')}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
