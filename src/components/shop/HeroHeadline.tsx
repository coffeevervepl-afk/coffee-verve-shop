'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  locale:         string
  title:          string
  subtitle:       string
  guaranteeLabel: string
}

const SPEED = 90 // ms per character — slower, more contemplative

// Shared styling for the small, muted guarantee note.
const GUARANTEE_CLS =
  'text-[13px] font-normal text-[#8A7A66] underline-offset-2 transition-colors hover:text-[#6B5A47] hover:underline'

export default function HeroHeadline({ locale, title, subtitle, guaranteeLabel }: Props) {
  const [typed, setTyped]       = useState('')
  const [cursorOn, setCursorOn] = useState(true)
  const [showSub, setShowSub]   = useState(false)

  useEffect(() => {
    // Respect reduced-motion: show everything immediately, no typing.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(title)
      setCursorOn(false)
      setShowSub(true)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    let i = 0
    const tick = () => {
      i += 1
      setTyped(title.slice(0, i))
      if (i < title.length) {
        timers.push(setTimeout(tick, SPEED))
      } else {
        // Typing done: fade the subtitle in shortly after, hide caret ~1s later.
        timers.push(setTimeout(() => setShowSub(true), 300))
        timers.push(setTimeout(() => setCursorOn(false), 1000))
      }
    }
    timers.push(setTimeout(tick, SPEED))
    return () => timers.forEach(clearTimeout)
  }, [title])

  return (
    <>
      {/* min-height is reserved by an invisible copy of the full title, so the
          page never jumps while the visible text is typed over it. */}
      <h1
        className="relative mx-auto mb-4 max-w-4xl text-center text-[42px] font-[600] leading-[1.05] text-[#3A2115] md:text-[70px]"
        style={{
          fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
        }}
      >
        <span className="invisible" aria-hidden="true">{title}</span>
        <span className="absolute inset-0" aria-hidden="true">
          {typed}
          {cursorOn && <span className="hero-caret">|</span>}
        </span>
        <span className="sr-only">{title}</span>
      </h1>

      {/* PL fits on one wide line with the note inline (already ideal — untouched).
          RU/UA are longer: keep a narrower column so they wrap cleanly to two
          lines, and drop the guarantee note onto its own centered line below. */}
      <div className={`mb-8 transition-opacity duration-700 ${showSub ? 'opacity-100' : 'opacity-0'}`}>
        <p
          className={`mx-auto text-center text-[18px] font-medium leading-relaxed text-[#5A4A3A] md:text-[25px] ${
            locale === 'pl' ? 'max-w-none' : 'max-w-2xl'
          }`}
        >
          {subtitle}
          {locale === 'pl' && (
            <>
              {' '}
              {/* TODO: point href to the guarantee page/anchor once it exists. */}
              <Link href="#" className={`whitespace-nowrap ${GUARANTEE_CLS}`}>{guaranteeLabel}</Link>
            </>
          )}
        </p>
        {locale !== 'pl' && (
          // TODO: point href to the guarantee page/anchor once it exists.
          <Link href="#" className={`mt-2.5 inline-block ${GUARANTEE_CLS}`}>{guaranteeLabel}</Link>
        )}
      </div>
    </>
  )
}
