'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'

// Fade-in-from-below on scroll (IntersectionObserver, threshold 0.1). Respects
// prefers-reduced-motion by rendering shown immediately.
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[600ms] ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[30px] opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
