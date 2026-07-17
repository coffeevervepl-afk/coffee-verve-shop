'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  // Title is two sentences separated by "\n" — each becomes its own line.
  title:          string
  subtitle:       string
  guaranteeLabel: string
}

const SPEED       = 50    // ms per character
const PAUSE       = 900   // ms dramatic pause between the two sentences
const CARET_HOLD  = 2200  // ms the caret keeps blinking after typing finishes
const CARET_FADE  = 600   // ms caret fade-out
const BLINK       = 500   // ms blink half-cycle

const GUARANTEE_CLS =
  'text-[13px] font-normal text-[#8A7A66] underline-offset-2 transition-colors hover:text-[#6B5A47] hover:underline'

export default function HeroHeadline({ title, subtitle, guaranteeLabel }: Props) {
  const parts = title.split('\n')
  const s1 = parts[0] ?? ''
  const s2 = parts[1] ?? ''

  const [typed1, setTyped1]           = useState('')
  const [typed2, setTyped2]           = useState('')
  const [broke, setBroke]             = useState(false) // <br> shown → line 2 started
  const [caretOpacity, setCaretOpacity] = useState(1)
  const [caretFading, setCaretFading] = useState(false)
  const [caretGone, setCaretGone]     = useState(false)
  const [showSub, setShowSub]         = useState(false)

  useEffect(() => {
    // Reduced motion → render the whole title/subtitle at once, no caret.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped1(s1)
      setTyped2(s2)
      setBroke(!!s2)
      setCaretGone(true)
      setShowSub(true)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms))
    const blink = setInterval(() => setCaretOpacity(o => (o ? 0 : 1)), BLINK)

    const finish = () => {
      at(() => setShowSub(true), 300)                    // subtitle fades in ~0.3s later
      at(() => {                                         // ~2-3 blinks, then fade the caret
        clearInterval(blink)
        setCaretOpacity(1)
        setCaretFading(true)
      }, CARET_HOLD)
      at(() => setCaretOpacity(0), CARET_HOLD + 40)
      at(() => setCaretGone(true), CARET_HOLD + 40 + CARET_FADE)
    }

    let j = 0
    const type2 = () => {
      j += 1
      setTyped2(s2.slice(0, j))
      if (j < s2.length) at(type2, SPEED)
      else finish()
    }
    const pause = () => {
      if (!s2) { finish(); return }
      setBroke(true)            // insert the <br> — caret jumps to line 2
      at(type2, SPEED)
    }
    let i = 0
    const type1 = () => {
      i += 1
      setTyped1(s1.slice(0, i))
      if (i < s1.length) at(type1, SPEED)
      else at(pause, PAUSE)     // first sentence done → dramatic pause
    }

    at(type1, SPEED)
    return () => { timers.forEach(clearTimeout); clearInterval(blink) }
  }, [s1, s2])

  return (
    <>
      {/* The invisible full title (both sentences + hard break) reserves the
          height, so the layout never jumps while the text is typed over it —
          on desktop and mobile, where each sentence may itself wrap. */}
      <h1
        className="relative mx-auto mb-3 max-w-6xl text-center text-[clamp(30px,4vw,52px)] font-[600] leading-[1.15] text-[#3A2115]"
        style={{ fontFamily: "'Lora', Georgia, 'Times New Roman', serif" }}
      >
        <span className="invisible" aria-hidden="true">{s1}<br />{s2}</span>
        <span className="absolute inset-0" aria-hidden="true">
          {typed1}
          {broke && <br />}
          {typed2}
          {!caretGone && (
            <span
              className="hero-caret"
              style={{ opacity: caretOpacity, transition: caretFading ? `opacity ${CARET_FADE}ms ease` : 'none' }}
            >
              |
            </span>
          )}
        </span>
        <span className="sr-only">{s1} {s2}</span>
      </h1>

      <div className={`transition-opacity duration-700 ${showSub ? 'opacity-100' : 'opacity-0'}`}>
        <p className="mx-auto max-w-2xl text-center text-[18px] font-medium leading-relaxed text-[#5A4A3A] md:text-[25px]">
          {subtitle}
        </p>
        {/* Guarantee note — its own centered line under the subtitle (all locales). */}
        {/* TODO: point href to the guarantee page/anchor once it exists. */}
        <Link href="#" className={`mt-2.5 inline-block ${GUARANTEE_CLS}`}>{guaranteeLabel}</Link>
      </div>
    </>
  )
}
