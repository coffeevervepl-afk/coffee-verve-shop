'use client'
import { useState } from 'react'

// Review photos: single = full width, several = a wrapping row. Click opens a lightbox.
export default function ReviewPhotos({ images }: { images: string[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (!images || images.length === 0) return null

  return (
    <>
      {images.length === 1 ? (
        <button type="button" onClick={() => setOpen(images[0])} className="mt-3 block w-full overflow-hidden rounded-xl border border-brand-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" loading="lazy" className="max-h-80 w-full object-cover" />
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => setOpen(src)}
              className="h-24 w-24 overflow-hidden rounded-lg border border-brand-border sm:h-28 sm:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          <button type="button" onClick={() => setOpen(null)} aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25">×</button>
        </div>
      )}
    </>
  )
}
