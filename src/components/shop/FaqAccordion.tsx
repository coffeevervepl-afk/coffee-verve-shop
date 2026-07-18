'use client'
import { useState } from 'react'

export interface FaqItem { q: string; a: string }

// Reusable FAQ accordion — slug-agnostic, takes any { q, a }[].
export default function FaqAccordion({ items, title }: { items: FaqItem[]; title?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!items?.length) return null

  return (
    <section className="mt-12">
      {title && <h2 className="mb-4 text-xl font-semibold text-[#3A2115] md:text-2xl">{title}</h2>}
      <div className="flex flex-col gap-3">
        {items.map((it, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="rounded-xl bg-[#F4F3F0]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-[#3A2115]">{it.q}</span>
                <span aria-hidden className={`shrink-0 text-[#8A7A66] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-[15px] leading-relaxed text-[#4A4540]">{it.a}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
