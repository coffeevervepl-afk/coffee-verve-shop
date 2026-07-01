'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/hooks/useCartStore'
import type { Locale, ShopProduct } from '@/types/shop'
import { getProductName, getProductFlavorNotes, getProductImage } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'

interface Props {
  product: ShopProduct
  locale:  Locale
}

export default function ProductCard({ product, locale }: Props) {
  const t    = useTranslations('product')
  const add  = useCartStore(s => s.addItem)
  const open = useCartStore(s => s.openDrawer)

  const name   = getProductName(product, locale)
  const notes  = getProductFlavorNotes(product, locale)
  const image  = getProductImage(product)
  const price  = product.price_250

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    add({
      product_id: product.id,
      slug:       product.slug,
      name,
      image,
      weight:     250,
      unit_price: price,
      qty:        1,
    })
    toast.success(`${name} — добавлено`)
    open()
  }

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="block group">
      <article className="card h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-brand-border/30">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.is_featured && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
              Pick
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3 md:p-4">
          <h3 className="text-sm font-semibold leading-snug md:text-base">{name}</h3>
          {notes && (
            <p className="mt-1 line-clamp-2 text-xs text-brand-muted md:text-sm">{notes}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-base font-bold md:text-lg">{fmtPrice(price)}</span>
            <button
              onClick={handleAddToCart}
              aria-label={t('add_to_cart')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white transition hover:opacity-80 active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
