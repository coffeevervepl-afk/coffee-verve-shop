'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/shop'

const METHODS = ['espresso', 'turka', 'frenchpress', 'aeropress', 'moka', 'filter', 'cup'] as const
type Method = (typeof METHODS)[number]
type Type   = 'black' | 'milk' | 'both'
type Taste  = 'classic' | 'fruity' | 'fermented'

// Brewing method → SEO slug (moka groups with espresso).
const METHOD_SLUG: Record<Method, string> = {
  espresso:    'do-ekspresu',
  turka:       'do-turki',
  frenchpress: 'do-french-pressu',
  aeropress:   'do-aeropressu',
  moka:        'do-ekspresu',
  filter:      'do-pourouvera',
  cup:         'do-filizanki',
}

const svg = (children: ReactNode) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)
const ICONS: Record<Method, ReactNode> = {
  espresso:    svg(<><path d="M6 4h12v4H6z" /><path d="M9 8v2M15 8v2" /><path d="M7 12h10v2a5 5 0 0 1-10 0z" /><path d="M9 20h6" /></>),
  turka:       svg(<><path d="M5 7h10l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7z" /><path d="M15 10h5" /></>),
  frenchpress: svg(<><path d="M8 3h8" /><path d="M12 3v3" /><path d="M7 6h10v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6z" /><path d="M7 10h10" /></>),
  aeropress:   svg(<><path d="M8 4h8v3H8z" /><path d="M9 7v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7" /></>),
  moka:        svg(<><path d="M6 13l1.5-6h9L18 13" /><path d="M6 13h12v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" /><path d="M18 10h3" /></>),
  filter:      svg(<><path d="M5 6h14l-5 7h-4z" /><path d="M12 13v3" /><path d="M8 19h8a4 4 0 0 0-8 0z" /></>),
  cup:         svg(<><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" /><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17" /><path d="M6 4c0 1-1 1-1 2M10 4c0 1-1 1-1 2" /></>),
}

interface Props {
  open:    boolean
  onClose: () => void
  locale:  Locale
}

const cardBase =
  'rounded-xl border border-transparent bg-[#F4F3F0] transition-colors hover:border-[#3A2115] focus:border-[#3A2115] focus:outline-none'

export default function CoffeeQuiz({ open, onClose, locale }: Props) {
  const t = useTranslations('shop')
  const router = useRouter()
  const [step, setStep]     = useState(1)
  const [type, setType]     = useState<Type | null>(null)
  const [method, setMethod] = useState<Method | null>(null)

  // Fresh start each time it opens.
  useEffect(() => {
    if (open) { setStep(1); setType(null); setMethod(null) }
  }, [open])

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const pickType   = (v: Type)   => { setType(v); setStep(2) }
  const pickMethod = (v: Method) => { setMethod(v); setStep(3) }
  const pickTaste  = (v: Taste)  => {
    // type=milk overrides the method-based slug.
    const slug = type === 'milk' ? 'do-mlecznych' : METHOD_SLUG[method ?? 'espresso']
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    qs.set('taste', v)
    onClose()
    router.push(`/${locale}/shop/${slug}?${qs.toString()}`)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div role="dialog" aria-modal="true"
           className="relative z-10 max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        {/* Header: back (left) · step counter + close (right) */}
        <div className="mb-6 flex items-center justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)}
                    className="text-sm font-medium text-[#8A7A66] transition-colors hover:text-[#3A2115]">
              ← {t('quiz.back')}
            </button>
          ) : <span />}
          <div className="flex items-center gap-4">
            <span className="text-sm tabular-nums text-brand-muted">{step}/3</span>
            <button type="button" onClick={onClose} aria-label={t('quiz.close')}
                    className="text-xl leading-none text-[#8A7A66] transition-colors hover:text-[#3A2115]">✕</button>
          </div>
        </div>

        <div key={step} className="quiz-step">
          {step === 1 && (
            <>
              <h2 className="mb-5 text-xl font-semibold text-[#3A2115] md:text-2xl">{t('quiz.step1_title')}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(['black', 'milk', 'both'] as Type[]).map(v => (
                  <button key={v} type="button" onClick={() => pickType(v)}
                          className={`${cardBase} p-5 text-left text-[15px] font-medium text-[#3A2115]`}>
                    {t(`quiz.type_${v}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-5 text-xl font-semibold text-[#3A2115] md:text-2xl">{t('quiz.step2_title')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {METHODS.map(m => (
                  <button key={m} type="button" onClick={() => pickMethod(m)}
                          className={`${cardBase} flex flex-col items-center gap-2 p-4 text-center`}>
                    <span className="text-[#3A2115]">{ICONS[m]}</span>
                    <span className="text-sm font-medium text-[#3A2115]">{t(`quiz.method_${m}`)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-5 text-xl font-semibold text-[#3A2115] md:text-2xl">{t('quiz.step3_title')}</h2>
              <div className="grid grid-cols-1 gap-3">
                {(['classic', 'fruity', 'fermented'] as Taste[]).map(v => (
                  <button key={v} type="button" onClick={() => pickTaste(v)}
                          className={`${cardBase} p-5 text-left text-[15px] font-medium text-[#3A2115]`}>
                    {t(`quiz.taste_${v}`)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
