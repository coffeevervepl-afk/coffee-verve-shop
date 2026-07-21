'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Bell, XCircle, CreditCard, Percent, Minus, Plus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getProductName, getProductImage } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import { brewMethods } from '@/lib/shopTags'
import CoffeeQuiz, { type QuizResult } from '@/components/shop/CoffeeQuiz'
import FaqAccordion, { type FaqItem } from '@/components/shop/FaqAccordion'
import Reveal from '@/components/shop/Reveal'
import type { Locale, ShopProduct } from '@/types/shop'

type Weight = 250 | 500 | 1000
const WEIGHTS: Weight[] = [250, 500, 1000]
const SUB_PCT = 5
const MIN_GRAMS = 1000

// DB stores the Russian country name — translate the chip label only.
const COUNTRY_NAMES: Record<string, { pl: string; ru: string; ua: string }> = {
  'Бразилия':   { pl: 'Brazylia',  ru: 'Бразилия',   ua: 'Бразилія' },
  'Эфиопия':    { pl: 'Etiopia',   ru: 'Эфиопия',    ua: 'Ефіопія' },
  'Гондурас':   { pl: 'Honduras',  ru: 'Гондурас',   ua: 'Гондурас' },
  'Мексика':    { pl: 'Meksyk',    ru: 'Мексика',    ua: 'Мексика' },
  'Колумбия':   { pl: 'Kolumbia',  ru: 'Колумбия',   ua: 'Колумбія' },
  'Кения':      { pl: 'Kenia',     ru: 'Кения',      ua: 'Кенія' },
  'Коста-Рика': { pl: 'Kostaryka', ru: 'Коста-Рика', ua: 'Коста-Ріка' },
  'Гватемала':  { pl: 'Gwatemala', ru: 'Гватемала',  ua: 'Гватемала' },
  'Перу':       { pl: 'Peru',      ru: 'Перу',       ua: 'Перу' },
  'Индонезия':  { pl: 'Indonezja', ru: 'Индонезия',  ua: 'Індонезія' },
  'Купаж':      { pl: 'Kupaż',     ru: 'Купаж',      ua: 'Купаж' },
}

interface Item { product: ShopProduct; weight: Weight; grind: 'whole' | 'ground'; qty: number }

interface Props { products: ShopProduct[]; locale: Locale }

const WEIGHT_LABEL: Record<Weight, string> = { 250: '250 г', 500: '500 г', 1000: '1 кг' }

function priceForWeight(p: ShopProduct, w: Weight): number {
  if (w === 500) return Number(p.price_500 ?? Number(p.price_250) * 2)
  if (w === 1000) return Number(p.price_1000 ?? Number(p.price_250) * 4)
  return Number(p.price_250)
}

export default function SubscriptionPage({ products, locale }: Props) {
  const t   = useTranslations('subscription')
  const tb  = useTranslations('shop')          // reuse custom_bundle.chip_* / .add / .chosen
  const tp  = useTranslations('product')        // grind labels
  const { user } = useAuth()

  const [items, setItems]           = useState<Item[]>([])
  const [activeFilters, setFilters] = useState<Set<string>>(new Set())
  const [quizOpen, setQuizOpen]     = useState(false)
  const [weeks, setWeeks]           = useState(4)
  const [modalOpen, setModalOpen]   = useState(false)
  const [email, setEmail]           = useState('')
  const [status, setStatus]         = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  // ── Filter chips (auto-generated, same logic as the bundle builder) ──────────
  const chips = useMemo(() => {
    const flavourText = (p: ShopProduct) =>
      [p.flavor_notes_ru, p.flavor_notes_pl, p.flavor_notes_ua, ...(p.flavor_tags ?? [])]
        .filter(Boolean).join(' ').toLowerCase()
    const out: { id: string; label: string; match: (p: ShopProduct) => boolean }[] = []
    Array.from(new Set(products.map(p => p.country?.trim()).filter((c): c is string => !!c)))
      .map(c => ({ raw: c, label: COUNTRY_NAMES[c]?.[locale] ?? c }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach(({ raw, label }) => out.push({ id: `c:${raw}`, label, match: p => p.country?.trim() === raw }))
    const FLAV = [
      { id: 'f:choco',   key: 'chip_choco',   re: /czekolad|chocolat|шокол/ },
      { id: 'f:fruit',   key: 'chip_fruit',   re: /owoc|fruit|frukt|фрукт|ягод|berr|jagod/ },
      { id: 'f:nuts',    key: 'chip_nuts',    re: /orzech|nut|орех|горіх/ },
      { id: 'f:caramel', key: 'chip_caramel', re: /karmel|caramel|карамел/ },
    ] as const
    FLAV.forEach(f => {
      const match = (p: ShopProduct) => f.re.test(flavourText(p))
      if (products.some(match)) out.push({ id: f.id, label: tb(`custom_bundle.${f.key}`), match })
    })
    const METH = [
      { id: 'm:espresso', key: 'chip_espresso', val: 'espresso' },
      { id: 'm:filter',   key: 'chip_filter',   val: 'filter' },
    ] as const
    METH.forEach(m => {
      const match = (p: ShopProduct) => brewMethods(p).includes(m.val)
      if (products.some(match)) out.push({ id: m.id, label: tb(`custom_bundle.${m.key}`), match })
    })
    return out
  }, [products, locale, tb])
  const chipById = useMemo(() => new Map(chips.map(c => [c.id, c] as const)), [chips])

  function matchesFilters(p: ShopProduct): boolean {
    if (activeFilters.size === 0) return true
    const groups: Record<string, string[]> = {}
    activeFilters.forEach(id => { const g = id.split(':')[0]; (groups[g] ??= []).push(id) })
    return Object.values(groups).every(ids => ids.some(id => chipById.get(id)?.match(p)))
  }
  function toggleFilter(id: string) {
    setFilters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function applyQuiz(res: QuizResult) {
    const ids: string[] = []
    if (res.type === 'milk' || res.method === 'espresso' || res.method === 'moka') ids.push('m:espresso')
    else if (res.method != null && (['filter', 'aeropress', 'frenchpress', 'cup'] as string[]).includes(res.method)) ids.push('m:filter')
    if (res.taste === 'fruity' || res.taste === 'fermented') ids.push('f:fruit')
    else if (res.taste === 'classic') ids.push('f:choco', 'f:nuts', 'f:caramel')
    setFilters(new Set(ids.filter(id => chipById.has(id))))
  }

  const visible = products.filter(matchesFilters)
  const isChosen = (id: string) => items.some(i => i.product.id === id)

  function toggleProduct(p: ShopProduct) {
    setItems(prev => prev.some(i => i.product.id === p.id)
      ? prev.filter(i => i.product.id !== p.id)
      : [...prev, { product: p, weight: 250, grind: 'whole', qty: 1 }])
  }
  function patchItem(id: string, patch: Partial<Item>) {
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, ...patch } : i))
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  const totalGrams = items.reduce((s, i) => s + i.weight * i.qty, 0)
  const subtotal   = items.reduce((s, i) => s + priceForWeight(i.product, i.weight) * i.qty, 0)
  const cardPct    = Number(user?.discount_pct ?? 0)
  const totalPct   = SUB_PCT + cardPct
  const finalPrice = subtotal * (1 - totalPct / 100)
  const minMet     = totalGrams >= MIN_GRAMS
  const days       = weeks * 7

  async function submitWaitlist() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setStatus('error'); return }
    setStatus('sending')
    try {
      const r = await fetch('/api/subscription-waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale }),
      })
      setStatus(r.ok ? 'done' : 'error')
    } catch { setStatus('error') }
  }

  const faq = (t.raw('faq') as FaqItem[]) ?? []

  const chipCls = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
      on ? 'border-[#412618] bg-[#412618] text-white' : 'bundle-chip border-[#D1C7BC] bg-transparent text-[#3A2115]'
    }`

  return (
    <div className="container pb-24 pt-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3A2115] md:text-5xl">{t('hero_title')}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-muted">{t('hero_subtitle')}</p>
      </Reveal>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-8">
        {[
          { icon: <Bell size={30} strokeWidth={1.6} />,       tk: 'b1' },
          { icon: <XCircle size={30} strokeWidth={1.6} />,    tk: 'b2' },
          { icon: <CreditCard size={30} strokeWidth={1.6} />, tk: 'b3' },
          { icon: <Percent size={30} strokeWidth={1.6} />,    tk: 'b4' },
        ].map((b, i) => (
          <Reveal key={b.tk} delay={i * 100} className="flex flex-col items-center text-center md:items-start md:text-left">
            <span className="text-[#412618]">{b.icon}</span>
            <h3 className="mt-3 font-semibold text-[#3A2115]">{t(`${b.tk}_title`)}</h3>
            <p className="mt-1 text-sm text-brand-muted">{t(`${b.tk}_text`)}</p>
          </Reveal>
        ))}
      </div>

      {/* ── Promo banner (warm block, like the product-page login promo) ──── */}
      <Reveal>
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl bg-[#3A2115] px-6 py-7 text-center text-white sm:flex-row sm:text-left">
          <span className="text-4xl">🎁</span>
          <div>
            <p className="text-lg font-semibold">{t('promo_title')}</p>
            <p className="mt-1.5 text-sm text-white/70">{t('promo_subtitle')}</p>
          </div>
        </div>
      </Reveal>

      {/* ── Build subscription ───────────────────────────────────────────── */}
      <Reveal className="mt-16">
        <h2 className="text-2xl font-semibold text-[#3A2115] md:text-3xl">{t('section_title')}</h2>
        <p className="mt-1 text-[15px] text-brand-muted">{t('section_subtitle')}</p>
      </Reveal>

      {/* Filter chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilters(new Set())} className={chipCls(activeFilters.size === 0)}>
          {tb('custom_bundle.chip_all')}
        </button>
        {chips.map(c => (
          <button key={c.id} type="button" onClick={() => toggleFilter(c.id)} className={chipCls(activeFilters.has(c.id))}>
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => setQuizOpen(true)}
          className="quiz-shimmer rounded-full px-4 py-2 text-[14px] transition hover:brightness-[0.98]">
          ✨ {tb('custom_bundle.chip_quiz')}
        </button>
      </div>

      {/* Product cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map(p => {
          const on = isChosen(p.id)
          return (
            <div key={p.id} role="button" tabIndex={0} onClick={() => toggleProduct(p)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProduct(p) } }}
              className={`relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 bg-white p-2 text-left transition ${
                on ? 'border-[#3A2115]' : 'border-transparent hover:border-[#E8E7E3]'
              }`}>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F4F3F0]">
                <Image src={getProductImage(p)} alt={getProductName(p, locale)} fill sizes="150px" className="object-cover" />
              </div>
              <p className="mt-1.5 truncate text-[13px] font-medium text-[#3A2115]">{getProductName(p, locale)}</p>
              <p className="text-[12px] text-brand-muted">{fmtPrice(Number(p.price_250 || 0))} / 250 г</p>
              <button type="button" onClick={e => { e.stopPropagation(); toggleProduct(p) }}
                className={`mt-2 w-full rounded-full px-4 py-1.5 text-[13px] font-medium shadow-sm transition ${
                  on ? 'bg-[#412618] text-white hover:bg-[#4A2C1A]'
                     : 'bundle-add-btn border border-[#E8E7E3] bg-white/70 text-[#3A2115] backdrop-blur-sm'
                }`}>
                {on ? `✓ ${tb('custom_bundle.chosen')}` : tb('custom_bundle.add')}
              </button>
            </div>
          )
        })}
      </div>

      {/* Selected items config */}
      {items.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {items.map(it => (
            <div key={it.product.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#E8E7E3] bg-white p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F4F3F0]">
                <Image src={getProductImage(it.product)} alt={getProductName(it.product, locale)} fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-[120px] flex-1 text-sm font-medium text-[#3A2115]">{getProductName(it.product, locale)}</div>

              {/* Weight */}
              <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
                {WEIGHTS.map(w => (
                  <button key={w} type="button" onClick={() => patchItem(it.product.id, { weight: w })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      it.weight === w ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
                    }`}>
                    {WEIGHT_LABEL[w]}
                  </button>
                ))}
              </div>

              {/* Grind */}
              <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
                {(['whole', 'ground'] as const).map(g => (
                  <button key={g} type="button" onClick={() => patchItem(it.product.id, { grind: g })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      it.grind === g ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'
                    }`}>
                    {g === 'whole' ? tp('grind_whole') : tp('grind_ground')}
                  </button>
                ))}
              </div>

              {/* Qty */}
              <div className="flex items-center gap-1 rounded-full border border-[#E8E7E3]">
                <button type="button" aria-label="-" onClick={() => patchItem(it.product.id, { qty: Math.max(1, it.qty - 1) })}
                  className="flex h-7 w-7 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Minus size={13} /></button>
                <span className="w-5 text-center text-xs font-semibold">{it.qty}</span>
                <button type="button" aria-label="+" onClick={() => patchItem(it.product.id, { qty: it.qty + 1 })}
                  className="flex h-7 w-7 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Plus size={13} /></button>
              </div>

              <span className="ml-auto text-sm font-semibold text-[#3A2115]">
                {fmtPrice(priceForWeight(it.product, it.weight) * it.qty)}
              </span>
              <button type="button" aria-label="remove" onClick={() => setItems(prev => prev.filter(i => i.product.id !== it.product.id))}
                className="text-[#8A7A66] transition-colors hover:text-red-500"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Interval + totals — only once something is picked */}
      {items.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
          {/* Interval */}
          <div className="rounded-2xl border border-[#E8E7E3] bg-white p-5">
            <h3 className="font-semibold text-[#3A2115]">{t('interval_title')}</h3>
            <div className="mt-3 flex items-center gap-2 text-[#3A2115]">
              <span className="text-sm">{t('interval_co')}</span>
              <div className="flex items-center gap-1 rounded-full border border-[#E8E7E3]">
                <button type="button" aria-label="-" onClick={() => setWeeks(w => Math.max(1, w - 1))}
                  className="flex h-8 w-8 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Minus size={14} /></button>
                <span className="w-6 text-center text-sm font-bold">{weeks}</span>
                <button type="button" aria-label="+" onClick={() => setWeeks(w => Math.min(8, w + 1))}
                  className="flex h-8 w-8 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Plus size={14} /></button>
              </div>
              <span className="text-sm">{t('interval_unit')}</span>
            </div>
            <p className="mt-2 text-[13px] text-brand-muted">{t('interval_note', { days })}</p>
          </div>

          {/* Totals */}
          <div className="h-fit rounded-2xl border border-[#E8E7E3] bg-white p-5">
            <p className="text-sm text-brand-muted">{t('summary', { count: items.length, kg: (totalGrams / 1000).toFixed(2) })}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-brand-muted"><span>{t('sum_full')}</span><span className="line-through">{fmtPrice(subtotal)}</span></div>
              <div className="flex justify-between text-[#3A2115]"><span>{t('sum_sub')}</span><span>−{fmtPrice(subtotal * SUB_PCT / 100)}</span></div>
              {cardPct > 0 && (
                <div className="flex justify-between text-[#3A2115]"><span>{t('sum_card', { pct: cardPct })}</span><span>−{fmtPrice(subtotal * cardPct / 100)}</span></div>
              )}
              <div className="flex justify-between border-t border-[#E8E7E3] pt-2 text-base font-bold text-[#3A2115]"><span>{t('sum_total')}</span><span>{fmtPrice(finalPrice)}</span></div>
            </div>
            {!minMet && <p className="mt-3 text-[13px] text-[#B45309]">{t('min_hint')}</p>}
            <button type="button" disabled={!minMet} onClick={() => { setStatus('idle'); setModalOpen(true) }}
              className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                minMet ? 'bg-[#412618] text-white hover:bg-[#4A2C1A]' : 'cursor-not-allowed bg-[#E8E7E3] text-[#9CA3AF]'
              }`}>
              {t('cta')}
            </button>
            <p className="mt-2 text-center text-[11px] text-brand-muted">{t('cta_note')}</p>
          </div>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Reveal className="mt-16">
        <FaqAccordion items={faq} title={t('faq_title')} />
      </Reveal>

      {/* Quiz + waitlist modal */}
      <CoffeeQuiz open={quizOpen} onClose={() => setQuizOpen(false)} locale={locale} onComplete={applyQuiz} />

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setModalOpen(false)} aria-label="close"
              className="absolute right-4 top-4 text-[#8A7A66] hover:text-[#3A2115]"><X size={18} /></button>
            {status === 'done' ? (
              <p className="py-4 text-center text-[15px] font-medium text-[#3A2115]">{t('modal_done')}</p>
            ) : (
              <>
                <p className="pr-6 text-[15px] text-[#3A2115]">{t('modal_text')}</p>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('modal_email_ph')}
                  className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#3A2115] ${status === 'error' ? 'border-red-400' : 'border-[#E8E7E3]'}`} />
                <button type="button" onClick={submitWaitlist} disabled={status === 'sending'}
                  className="mt-3 w-full rounded-full bg-[#412618] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4A2C1A] disabled:opacity-60">
                  {t('modal_btn')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
