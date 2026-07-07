'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface Props {
  images:     string[]
  name:       string
  video_url?: string
}

type Slide = { type: 'image'; src: string } | { type: 'video'; src: string }

export default function ProductGallery({ images, name, video_url }: Props) {
  const slides: Slide[] = [
    ...images.slice(0, 4).map((src): Slide => ({ type: 'image', src })),
    ...(video_url ? [{ type: 'video', src: video_url } as Slide] : []),
  ]

  const [active, setActive] = useState(0)
  const activeSlide = slides[active] ?? slides[0]
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) setActive(a => Math.min(a + 1, slides.length - 1))
      else setActive(a => Math.max(a - 1, 0))
    }
    touchStartX.current = null
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-brand-border/20"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {activeSlide.type === 'video' ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover rounded-2xl"
            src={activeSlide.src}
          />
        ) : (
          <Image
            src={activeSlide.src}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      {slides.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-brand-border/20 transition ${
                i === active ? 'ring-2 ring-brand-accent' : ''
              }`}
            >
              {slide.type === 'video' ? (
                <div className="flex h-full w-full items-center justify-center bg-brand-accent">
                  <Play size={18} className="fill-white text-white" />
                </div>
              ) : (
                <Image src={slide.src} alt={`${name} ${i + 1}`} fill sizes="25vw" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
