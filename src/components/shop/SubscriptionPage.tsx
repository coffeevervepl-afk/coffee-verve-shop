'use client'
import { useState, useMemo, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Minus, Plus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { getProductName, getProductImage } from '@/lib/product-utils'
import { fmtPrice } from '@/lib/pricing'
import { brewMethods } from '@/lib/shopTags'
import CoffeeQuiz, { type QuizResult } from '@/components/shop/CoffeeQuiz'
import FaqAccordion, { type FaqItem } from '@/components/shop/FaqAccordion'
import DeliveryForm from '@/components/shop/checkout/DeliveryForm'
import Reveal from '@/components/shop/Reveal'
import type { Locale, ShopProduct, DeliveryType } from '@/types/shop'

type Weight = 250 | 500 | 1000
const WEIGHTS: Weight[] = [250, 500, 1000]
const SUB_PCT = 5
const MIN_ORDER_GRAMS = 250    // less than this is too little to ship
const FREE_SHIP_GRAMS = 1000   // 1 kg+ ships free
const DELIVERY_COST: Record<DeliveryType, number> = { paczkomat: 14.99, courier: 19.99, pickup: 0 }
const CONFIG_KEY = 'cv_sub_config'

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
const LOCALE_TAG: Record<Locale, string> = { pl: 'pl-PL', ru: 'ru-RU', ua: 'uk-UA' }

function priceForWeight(p: ShopProduct, w: Weight): number {
  if (w === 500) return Number(p.price_500 ?? Number(p.price_250) * 2)
  if (w === 1000) return Number(p.price_1000 ?? Number(p.price_250) * 4)
  return Number(p.price_250)
}

// Small modal shell (matches the other shop modals).
function Modal({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true"
           className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${wide ? 'max-w-[520px]' : 'max-w-[420px]'}`}>
        <button type="button" onClick={onClose} aria-label="close" className="absolute right-4 top-4 text-[#8A7A66] hover:text-[#3A2115]"><X size={18} /></button>
        {children}
      </div>
    </div>
  )
}

// Bespoke animated graphics for the 4 subscription benefit cards (keyframes live
// in globals.css, all gated by prefers-reduced-motion). Order matches b1–b4.
const BENEFIT_GRAPHICS: React.ReactNode[] = [
  // b1 — bell rings with two expanding waves (white on brown card)
  <span key="b1" className="relative inline-flex h-16 w-16 items-center justify-center">
    <span aria-hidden className="sub-wave absolute h-10 w-10 rounded-full border border-white/35" />
    <span aria-hidden className="sub-wave sub-wave-2 absolute h-10 w-10 rounded-full border border-white/35" />
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="sub-bell relative">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  </span>,
  // b2 — ring draws, then the cross is stroked in (white)
  <svg key="b2" width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round">
    <circle cx="24" cy="24" r="20" className="sub-draw-circle" />
    <line x1="17" y1="17" x2="31" y2="31" className="sub-draw-x1" />
    <line x1="31" y1="17" x2="17" y2="31" className="sub-draw-x2" />
  </svg>,
  // b3 — bank card breathing (white face, light-gray details)
  <div key="b3" className="sub-breathe" style={{ filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.28))' }}>
    <svg width="64" height="46" viewBox="0 0 56 40" fill="none">
      <rect x="1" y="1" width="54" height="38" rx="6" fill="#ffffff" />
      <rect x="1.9" y="9" width="52.2" height="7" fill="#c9bdb4" />
      <rect x="7" y="24" width="12" height="9" rx="2" fill="#efe9e3" stroke="#c9bdb4" strokeWidth={1} />
      <line x1="34" y1="30.5" x2="49" y2="30.5" stroke="#c9bdb4" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  </div>,
  // b4 — accent: shimmer badge with -5%, gently breathing
  <span key="b4" className="sub-badge inline-flex">
    <span className="brand-shimmer inline-flex h-14 w-14 items-center justify-center rounded-full text-[15px] font-bold tracking-tight text-[#3a1f16] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)]">−5%</span>
  </span>,
]

export default function SubscriptionPage({ products, locale }: Props) {
  const t   = useTranslations('subscription')
  const tb  = useTranslations('shop')          // reuse custom_bundle.chip_* / .add / .chosen
  const tp  = useTranslations('product')        // grind labels
  const { user, loading } = useAuth()

  const [items, setItems]           = useState<Item[]>([])
  const [activeFilters, setFilters] = useState<Set<string>>(new Set())
  const [quizOpen, setQuizOpen]     = useState(false)
  const [weeks, setWeeks]           = useState(4)

  // Checkout flow
  const [flow, setFlow]                     = useState<null | 'auth' | 'delivery' | 'success'>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryType>('paczkomat')
  const [deliveryValues, setDeliveryValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting]         = useState(false)
  const [firstDate, setFirstDate]           = useState('')
  const [error, setError]                   = useState('')

  // Restore a config saved before an auth redirect (once, on mount).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      if (!raw) return
      const cfg = JSON.parse(raw)
      if (Array.isArray(cfg.items)) {
        const restored = cfg.items
          .map((ci: any) => {
            const p = products.find(x => x.id === ci.product_id)
            return p ? { product: p, weight: ci.weight as Weight, grind: ci.grind as 'whole' | 'ground', qty: ci.qty } : null
          })
          .filter(Boolean) as Item[]
        if (restored.length) setItems(restored)
      }
      if (cfg.weeks) setWeeks(cfg.weeks)
    } catch { /* ignore */ }
  }, [products])

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
  const totalGrams   = items.reduce((s, i) => s + i.weight * i.qty, 0)
  const subtotal     = items.reduce((s, i) => s + priceForWeight(i.product, i.weight) * i.qty, 0)
  const cardPct      = Number(user?.discount_pct ?? 0)
  const totalPct     = SUB_PCT + cardPct
  const afterDisc    = subtotal * (1 - totalPct / 100)
  const freeShip     = totalGrams >= FREE_SHIP_GRAMS
  const deliveryCost = freeShip ? 0 : DELIVERY_COST[deliveryMethod]
  const grandTotal   = afterDisc + deliveryCost
  const canOrder     = items.length >= 1 && totalGrams >= MIN_ORDER_GRAMS
  const days         = weeks * 7

  const faq = (t.raw('faq') as FaqItem[]) ?? []

  const chipCls = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
      on ? 'border-[#412618] bg-[#412618] text-white' : 'bundle-chip border-[#D1C7BC] bg-transparent text-[#3A2115]'
    }`

  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({
        items: items.map(i => ({ product_id: i.product.id, weight: i.weight, grind: i.grind, qty: i.qty })),
        weeks,
      }))
    } catch { /* ignore */ }
  }
  function goAuth(kind: 'login' | 'register') {
    saveConfig()
    window.location.href = `/${locale}/account/${kind}`
  }

  function onCta() {
    if (loading) return
    setError('')
    if (items.length < 1) { setError(t('err_items')); return }
    if (totalGrams < MIN_ORDER_GRAMS) { setError(t('err_weight')); return }
    if (!user) { setFlow('auth'); return }
    setFlow('delivery')
  }

  function validateDelivery(): string | null {
    if (deliveryMethod === 'courier') {
      if (!deliveryValues.street?.trim() || !deliveryValues.city?.trim() || !deliveryValues.postal_code?.trim()) return t('err_delivery_addr')
    } else if (deliveryMethod === 'paczkomat') {
      if (!deliveryValues.paczkomat_code?.trim()) return t('err_paczkomat')
    }
    return null
  }

  async function createSubscription() {
    const dErr = validateDelivery()
    if (dErr) { setError(dErr); return }
    setError('')
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const authId = session?.user?.id
      if (!authId) { setSubmitting(false); setFlow('auth'); return }

      const nd = new Date()
      nd.setDate(nd.getDate() + weeks * 7)
      const ndStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`

      const dbItems = items.map(i => ({
        product_id: i.product.id,
        name:       getProductName(i.product, locale),
        weight:     i.weight,
        grind:      i.grind === 'ground' ? 'ground' : 'beans',
        quantity:   i.qty,
        price:      Math.round(priceForWeight(i.product, i.weight) * 100), // grosze
      }))
      const address =
        deliveryMethod === 'paczkomat'
          ? { code: deliveryValues.paczkomat_code ?? '', name: deliveryValues.paczkomat_name ?? '' }
          : deliveryMethod === 'courier'
            ? { street: deliveryValues.street ?? '', city: deliveryValues.city ?? '', postal_code: deliveryValues.postal_code ?? '' }
            : { location: 'Coffee Verve, Warszawa' }

      const { error: insErr } = await supabase.from('subscriptions').insert({
        user_id:            authId,
        status:             'active',
        items:              dbItems,
        interval_weeks:     weeks,
        next_delivery_date: ndStr,
        discount_percent:   SUB_PCT,
        payment_method:     'manual',
        delivery_method:    deliveryMethod,
        delivery_address:   address,
      })
      setSubmitting(false)
      if (insErr) { setError(t('err_generic')); return }
      try { localStorage.removeItem(CONFIG_KEY) } catch { /* ignore */ }
      setFirstDate(ndStr)
      setFlow('success')
    } catch {
      setSubmitting(false)
      setError(t('err_generic'))
    }
  }

  const dateFmt = (s: string) => {
    try { return new Date(s).toLocaleDateString(LOCALE_TAG[locale], { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return s }
  }

  return (
    <div className="container pb-24 pt-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3A2115] md:text-5xl">{t('hero_title')}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-muted">{t('hero_subtitle')}</p>
      </Reveal>

      {/* ── Benefits — 4 compact cards on white (no panel). Big animated icon
           left + 1-line title; on hover a full-text overlay slides in above
           neighbours (z-raised). The -5% card's top stripe is the brand
           shimmer, the other three solid brown. Copy (b1–b4) unchanged. ── */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFIT_GRAPHICS.map((g, i) => (
          <Reveal key={i} delay={i * 80} className="group relative hover:z-10">
            {/* base — white icon + full title (up to 2 lines) on brand brown */}
            <div className="relative flex h-full min-h-[140px] items-center gap-4 overflow-hidden rounded-2xl border border-[#9a8776] bg-[#a89583] p-5 shadow-sm">
              <div className="flex w-[88px] shrink-0 items-center justify-center">{g}</div>
              <h3 className="sub-clamp2 min-w-0 flex-1 break-words text-sm font-medium leading-snug text-white">{t(`b${i + 1}_title`)}</h3>
            </div>
            {/* hover overlay — full title + description, slightly lighter brown */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 translate-y-1 overflow-hidden rounded-2xl border border-[#8a786d] bg-[#98857a] opacity-0 shadow-xl transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              <div className="flex min-h-[140px] items-center gap-4 p-5">
                <div className="flex w-[88px] shrink-0 items-center justify-center">{g}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-medium leading-snug text-white">{t(`b${i + 1}_title`)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">{t(`b${i + 1}_text`)}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ── Promo banner — light-gray card w/ accent stripe (matches /shop/nabory) ── */}
      <Reveal>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-[#E8E7E3] border-t-2 border-t-[#412618] bg-[#F4F3F0] p-6 text-center shadow-sm sm:flex-row sm:items-start sm:text-left">
          <span className="text-3xl">🎁</span>
          <div>
            <p className="text-lg font-semibold text-[#412618]">{t('promo_title')}</p>
            <p className="mt-1.5 text-sm text-gray-600">{t('promo_subtitle')}</p>
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

              <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
                {WEIGHTS.map(w => (
                  <button key={w} type="button" onClick={() => patchItem(it.product.id, { weight: w })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${it.weight === w ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'}`}>
                    {WEIGHT_LABEL[w]}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 rounded-full bg-[#F4F3F0] p-0.5">
                {(['whole', 'ground'] as const).map(g => (
                  <button key={g} type="button" onClick={() => patchItem(it.product.id, { grind: g })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${it.grind === g ? 'bg-[#412618] text-white' : 'text-[#6E6D68]'}`}>
                    {g === 'whole' ? tp('grind_whole') : tp('grind_ground')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-full border border-[#E8E7E3]">
                <button type="button" aria-label="-" onClick={() => patchItem(it.product.id, { qty: Math.max(1, it.qty - 1) })}
                  className="flex h-7 w-7 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Minus size={13} /></button>
                <span className="w-5 text-center text-xs font-semibold">{it.qty}</span>
                <button type="button" aria-label="+" onClick={() => patchItem(it.product.id, { qty: it.qty + 1 })}
                  className="flex h-7 w-7 items-center justify-center text-[#6E6D68] hover:text-[#3A2115]"><Plus size={13} /></button>
              </div>

              <span className="ml-auto text-sm font-semibold text-[#3A2115]">{fmtPrice(priceForWeight(it.product, it.weight) * it.qty)}</span>
              <button type="button" aria-label="remove" onClick={() => setItems(prev => prev.filter(i => i.product.id !== it.product.id))}
                className="text-[#8A7A66] transition-colors hover:text-red-500"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Interval + totals */}
      {items.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
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

          <div className="h-fit rounded-2xl border border-[#E8E7E3] bg-white p-5">
            <p className="text-sm text-brand-muted">{t('summary', { count: items.length, kg: (totalGrams / 1000).toFixed(2) })}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-brand-muted"><span>{t('sum_full')}</span><span className="line-through">{fmtPrice(subtotal)}</span></div>
              <div className="flex justify-between text-[#3A2115]"><span>{t('sum_sub')}</span><span>−{fmtPrice(subtotal * SUB_PCT / 100)}</span></div>
              {cardPct > 0 && (
                <div className="flex justify-between text-[#3A2115]"><span>{t('sum_card', { pct: cardPct })}</span><span>−{fmtPrice(subtotal * cardPct / 100)}</span></div>
              )}
              <div className="flex justify-between text-[#3A2115]">
                <span>{t('delivery_label')}</span>
                <span>{freeShip ? t('delivery_free') : t('delivery_addmore')}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E7E3] pt-2 text-base font-bold text-[#3A2115]"><span>{t('sum_total')}</span><span>{fmtPrice(afterDisc)}</span></div>
            </div>
            {error && <p className="mt-3 text-[13px] font-medium text-[#412618]">{error}</p>}
            <button type="button" disabled={!canOrder} onClick={onCta}
              className={`mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${canOrder ? 'bg-[#412618] text-white hover:bg-[#4A2C1A]' : 'cursor-not-allowed bg-[#E8E7E3] text-[#9CA3AF]'}`}>
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

      {/* Quiz */}
      <CoffeeQuiz open={quizOpen} onClose={() => setQuizOpen(false)} locale={locale} onComplete={applyQuiz} />

      {/* Auth modal */}
      {flow === 'auth' && (
        <Modal onClose={() => setFlow(null)}>
          <p className="pr-6 text-[15px] text-[#3A2115]">{t('auth_text')}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => goAuth('login')}
              className="flex-1 rounded-full bg-[#412618] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4A2C1A]">{t('auth_login')}</button>
            <button type="button" onClick={() => goAuth('register')}
              className="flex-1 rounded-full border border-[#412618] px-5 py-3 text-sm font-semibold text-[#412618] transition hover:bg-[#412618]/5">{t('auth_register')}</button>
          </div>
        </Modal>
      )}

      {/* Delivery modal */}
      {flow === 'delivery' && (
        <Modal wide onClose={() => setFlow(null)}>
          <h3 className="mb-4 text-lg font-semibold text-[#3A2115]">{t('delivery_title')}</h3>
          <DeliveryForm
            delivery={deliveryMethod}
            onDeliveryChange={setDeliveryMethod}
            values={deliveryValues}
            onChange={v => setDeliveryValues(prev => ({ ...prev, ...v }))}
          />
          {deliveryMethod === 'paczkomat' && (
            <div className="mt-3 space-y-2">
              <input className="input" placeholder={t('pack_code')} value={deliveryValues.paczkomat_code ?? ''}
                onChange={e => setDeliveryValues(p => ({ ...p, paczkomat_code: e.target.value }))} />
              <input className="input" placeholder={t('pack_name')} value={deliveryValues.paczkomat_name ?? ''}
                onChange={e => setDeliveryValues(p => ({ ...p, paczkomat_name: e.target.value }))} />
            </div>
          )}

          <div className="mt-5 space-y-1.5 rounded-xl bg-[#F4F3F0] p-4 text-sm">
            <div className="flex justify-between text-brand-muted"><span>{t('sum_full')}</span><span>{fmtPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#3A2115]"><span>{t('sum_sub')}</span><span>−{fmtPrice(subtotal * SUB_PCT / 100)}</span></div>
            {cardPct > 0 && (
              <div className="flex justify-between text-[#3A2115]"><span>{t('sum_card', { pct: cardPct })}</span><span>−{fmtPrice(subtotal * cardPct / 100)}</span></div>
            )}
            <div className="flex justify-between text-[#3A2115]">
              <span>{t('delivery_label')}</span>
              <span>{freeShip ? t('delivery_free') : fmtPrice(deliveryCost)}</span>
            </div>
            {!freeShip && <p className="text-[12px] text-brand-muted">{t('delivery_addmore')}</p>}
            <div className="flex justify-between border-t border-[#E8E7E3] pt-2 text-base font-bold text-[#3A2115]"><span>{t('sum_total')}</span><span>{fmtPrice(grandTotal)}</span></div>
          </div>

          {error && <p className="mt-3 text-[13px] font-medium text-[#412618]">{error}</p>}
          <button type="button" onClick={createSubscription} disabled={submitting}
            className="mt-4 w-full rounded-full bg-[#412618] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4A2C1A] disabled:opacity-60">
            {t('cta')}
          </button>
          <p className="mt-2 text-center text-[11px] text-brand-muted">{t('cta_note')}</p>
        </Modal>
      )}

      {/* Success modal */}
      {flow === 'success' && (
        <Modal onClose={() => setFlow(null)}>
          <div className="py-2 text-center">
            <p className="text-xl font-bold text-[#3A2115]">{t('success_title')}</p>
            <p className="mt-3 text-[15px] text-[#3A2115]">{t('success_first', { date: dateFmt(firstDate) })}</p>
            <p className="mt-1 text-sm text-brand-muted">{t('success_manage')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/account`} className="flex-1 rounded-full bg-[#412618] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#4A2C1A]">{t('success_account')}</Link>
              <Link href={`/${locale}`} className="flex-1 rounded-full border border-[#412618] px-5 py-3 text-center text-sm font-semibold text-[#412618] transition hover:bg-[#412618]/5">{t('success_home')}</Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
