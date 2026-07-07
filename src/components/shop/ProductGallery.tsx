'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  name:   string
}

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0)
  const mainImage = images[active] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-border/20">
        <Image
          src={mainImage}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-brand-border/20 transition ${
                i === active ? 'ring-2 ring-brand-accent' : ''
              }`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
