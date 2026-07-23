'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { fmtPrice } from '@/lib/pricing'
import type { Locale } from '@/types/shop'

type Weight = 250 | 500 | 1000
type Grind = 'beans' | 'ground'
type Method = 'paczkomat' | 'courier' | 'pickup'

export interface EditorItem {
  product_id: string | null
  name:       string
  weight:     Weight
  grind:      Grind
  quantity:   number
  price:      number // grosze, per single unit at the chosen weight
}
export interface EditorSub {
  id:                 string
  items:              EditorItem[]
  interval_weeks:     number
  next_delivery_date: string
  delivery_method:    string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delivery_address:   Record<string, any> | null
}
export type EditorSection = 'composition' | 'delivery' | 'schedule'

interface CatalogProduct { id: string; name: string; flavor: string; image: string | null; price_250: number; price_500: number | null; price_1000: number | null }

const SUB_PCT = 5
const FREE_SHIP_GRAMS = 1000
const DELIVERY_COST: Record<Method, number> = { paczkomat: 14.99, courier: 19.99, pickup: 0 }
const WEIGHTS: Weight[] = [250, 500, 1000]
const wLabel = (w: number) => (w >= 1000 ? `${w / 1000} кг` : `${w} г`)

function unitPriceZl(p: { price_250: number; price_500: number | null; price_1000: number | null }, w: Weight): number {
  if (w === 500)  return Number(p.price_500  ?? p.price_250 * 2)
  if (w === 1000) return Number(p.price_1000 ?? p.price_250 * 4)
  return Number(p.price_250)
}

export default function SubscriptionEditor({
  sub, locale, loyaltyPct, initialSection = 'schedule', onClose, onSaved,
}: {
  sub: EditorSub
  locale: Locale
  loyaltyPct: number
  initialSection?: EditorSection
  onClose: () => void
  onSaved: (patch: { items: EditorItem[]; interval_weeks: number; next_delivery_date: string; delivery_method: string; delivery_address: Record<string, unknown> }) => void
}) {
  const t  = useTranslations('account')
  const tp = useTranslations('product')

  const [items, setItems]     = useState<EditorItem[]>(() => sub.items.map(i => ({ ...i })))
  const [method, setMethod]   = useState<Method>((sub.delivery_method as Method) || 'paczkomat')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: Record<string, any> = sub.delivery_address ?? {}
  const [paczCode, setPaczCode] = useState<string>(a.code ?? '')
  const [paczName, setPaczName] = useState<string>(a.name ?? '')
  const [street, setStreet]     = useState<string>(a.street ?? '')
  const [city, setCity]         = useState<string>(a.city ?? '')
  const [postal, setPostal]     = useState<string>(a.postal_code ?? '')
  const [weeks, setWeeks]       = useState<number>(sub.interval_weeks)
  const [date, setDate]         = useState<string>(sub.next_delivery_date.slice(0, 10))
  const [catalog, setCatalog]   = useState<CatalogProduct[]>([])
  const [picking, setPicking]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const compRef = useRef<HTMLDivElement>(null)
  const delivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await createClient().from('shop_products')
        .select('id, product_type, name_ru, name_pl, name_ua, flavor_notes_ru, flavor_notes_pl, flavor_notes_ua, price_250, price_500, price_1000, images, sort_order')
        .eq('is_active', true).order('sort_order', { ascending: true })
      if (!active) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data ?? []) as any[]
      const nc = locale === 'pl' ? 'name_pl' : locale === 'ua' ? 'name_ua' : 'name_ru'
      const fc = locale === 'pl' ? 'flavor_notes_pl' : locale === 'ua' ? 'flavor_notes_ua' : 'flavor_notes_ru'
      setCatalog(rows.filter(p => p.product_type !== 'bundle').map(p => ({
        id: p.id, name: p[nc] || p.name_ru, flavor: p[fc] || p.flavor_notes_ru || '',
        image: Array.isArray(p.images) ? (p.images[0] ?? null) : null,
        price_250: Number(p.price_250), price_500: p.price_500 != null ? Number(p.price_500) : null, price_1000: p.price_1000 != null ? Number(p.price_1000) : null,
      })))
    })()
    return () => { active = false }
  }, [locale])

  // Scroll to the requested section once mounted.
  useEffect(() => {
    const ref = initialSection === 'composition' ? compRef : initialSection === 'delivery' ? delivRef : null
    if (ref?.current) ref.current.scrollIntoView({ block: 'start' })
  }, [initialSection])

  const catMap = useMemo(() => Object.fromEntries(catalog.map(p => [p.id, p])), [catalog])
  const grindLabel = (g: Grind) => (g === 'ground' ? tp('grind_ground') : tp('grind_whole'))

  // Grosze unit price for an item at a given weight (live catalog, else scale stored).
  function priceForWeight(it: EditorItem, w: Weight): number {
    const p = it.product_id ? catMap[it.product_id] : null
    if (p) return Math.round(unitPriceZl(p, w) * 100)
    const per250 = it.weight === 250 ? it.price : it.weight === 500 ? it.price / 2 : it.price / 4
    return Math.round(per250 * (w / 250))
  }

  function setWeight(idx: number, w: Weight) {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, weight: w, price: priceForWeight(it, w) } : it)))
  }
  function setGrind(idx: number, g: Grind) { setItems(prev => prev.map((it, i) => (i === idx ? { ...it, grind: g } : it))) }
  function setQty(idx: number, q: number)  { setItems(prev => prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, Math.min(10, q)) } : it))) }
  function remove(idx: number)             { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)) }
  function add(p: CatalogProduct) {
    if (items.length >= 10) return
    setItems(prev => [...prev, { product_id: p.id, name: p.name, weight: 250, grind: 'beans', quantity: 1, price: Math.round(p.price_250 * 100) }])
    setPicking(false)
  }

  const subtotal     = items.reduce((s, it) => s + (it.price / 100) * it.quantity, 0)
  const subDisc      = subtotal * SUB_PCT / 100
  const cardDisc     = subtotal * loyaltyPct / 100
  const grams        = items.reduce((s, it) => s + it.weight * it.quantity, 0)
  const freeShip     = grams >= FREE_SHIP_GRAMS
  const deliveryCost = freeShip ? 0 : DELIVERY_COST[method]
  const total        = subtotal - subDisc - cardDisc + deliveryCost

  const deliveryOk = method === 'pickup' || (method === 'paczkomat' ? !!paczCode.trim() : (!!street.trim() && !!city.trim() && !!postal.trim()))
  const canSave = items.length >= 1 && deliveryOk

  async function save() {
    if (!canSave) return
    setSaving(true)
    const dbItems = items.map(it => ({ product_id: it.product_id, name: it.name, weight: it.weight, grind: it.grind, quantity: it.quantity, price: it.price }))
    const address = method === 'paczkomat'
      ? { code: paczCode.trim(), name: paczName.trim() }
      : method === 'courier'
        ? { street: street.trim(), city: city.trim(), postal_code: postal.trim() }
        : { location: 'Coffee Verve, Warszawa' }
    const { error } = await createClient().from('subscriptions')
      .update({ items: dbItems, delivery_method: method, delivery_address: address, interval_weeks: weeks, next_delivery_date: date })
      .eq('id', sub.id)
    setSaving(false)
    if (error) { toast.error(t('editor_save_error')); return }
    toast.success(t('editor_saved'))
    onSaved({ items, interval_weeks: weeks, next_delivery_date: date, delivery_method: method, delivery_address: address })
  }

  const methodTile = (m: Method, title: string, subtitle: string) => (
    <button type="button" onClick={() => setMethod(m)}
      className={`flex flex-col rounded-xl border-2 p-4 text-left transition-all ${method === m ? 'border-[#412618] bg-[#412618]/5' : 'border-gray-200 bg-white hover:border-[#412618] hover:shadow-sm'}`}>
      <span className="text-base font-semibold text-[#3A2115]">{title}</span>
      <span className="mt-0.5 text-sm text-gray-600">{subtitle}</span>
    </button>
  )
  const gt = (g: Grind, idx: number, cur: Grind) => (
    <button key={g} type="button" onClick={() => setGrind(idx, g)}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${cur === g ? 'bg-[#412618] text-white' : 'text-[#6E6D68] hover:text-[#412618]'}`}>
      {grindLabel(g)}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>

        {/* ── Composition ── */}
        <div ref={compRef}>
          <h3 className="text-xl font-semibold text-[#412618]">{t('editor_composition_title')}</h3>
          <div className="mt-4 space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-[#3A2115]">{it.name}</span>
                  <button type="button" onClick={() => remove(idx)} disabled={items.length <= 1}
                    className="text-sm font-medium text-[#412618] hover:underline disabled:opacity-30">✕</button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select value={it.weight} onChange={e => setWeight(idx, Number(e.target.value) as Weight)} className="input !w-auto py-1 text-xs">
                    {WEIGHTS.map(w => <option key={w} value={w}>{wLabel(w)}</option>)}
                  </select>
                  <span className="flex gap-1 rounded-full bg-gray-100 p-0.5">{(['beans', 'ground'] as Grind[]).map(g => gt(g, idx, it.grind))}</span>
                  <span className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setQty(idx, it.quantity - 1)} className="h-6 w-6 rounded-full border border-gray-300 text-sm text-[#412618]">−</button>
                    <span className="w-5 text-center text-sm">{it.quantity}</span>
                    <button type="button" onClick={() => setQty(idx, it.quantity + 1)} className="h-6 w-6 rounded-full border border-gray-300 text-sm text-[#412618]">+</button>
                  </span>
                  <span className="ml-auto text-sm font-semibold text-[#3A2115]">{fmtPrice((it.price / 100) * it.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && <p className="mt-2 text-sm text-[#7A5A3A]">{t('editor_min_warning')}</p>}

          {items.length < 10 ? (
            <button type="button" onClick={() => setPicking(v => !v)} className="mt-3 rounded-full border border-[#412618] px-4 py-2 text-sm font-semibold text-[#412618] transition-colors hover:bg-[#412618]/5">
              {t('editor_add_coffee')}
            </button>
          ) : <p className="mt-3 text-sm text-gray-500">{t('editor_max_items')}</p>}

          {picking && (
            <div className="mt-3 rounded-xl border border-gray-200 p-2">
              <p className="px-1 pb-2 text-xs font-semibold uppercase text-gray-500">{t('editor_pick_title')}</p>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {catalog.map(p => (
                  <button key={p.id} type="button" onClick={() => add(p)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {p.image && <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#3A2115]">{p.name}</p>
                      {p.flavor && <p className="truncate text-xs text-gray-500">{p.flavor}</p>}
                    </div>
                    <span className="shrink-0 text-sm text-gray-600">{fmtPrice(p.price_250)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between text-gray-500"><span>{t('sum_base')}</span><span>{fmtPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#3A2115]"><span>{t('sum_sub', { pct: SUB_PCT })}</span><span>−{fmtPrice(subDisc)}</span></div>
            {loyaltyPct > 0 && <div className="flex justify-between text-[#3A2115]"><span>{t('sum_card', { pct: loyaltyPct })}</span><span>−{fmtPrice(cardDisc)}</span></div>}
            <div className="flex justify-between text-[#3A2115]"><span>{t('sum_delivery')}</span><span>{freeShip ? t('sum_free') : fmtPrice(deliveryCost)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-bold text-[#412618]"><span>{t('sum_total')}</span><span>{fmtPrice(total)}</span></div>
          </div>
        </div>

        {/* ── Delivery ── */}
        <div ref={delivRef} className="mt-6 border-t border-gray-200 pt-5">
          <h3 className="text-xl font-semibold text-[#412618]">{t('editor_delivery_title')}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {methodTile('paczkomat', t('delivery_paczkomat_t'), t('delivery_paczkomat_s'))}
            {methodTile('courier', t('delivery_courier_t'), t('delivery_courier_s'))}
            {methodTile('pickup', t('delivery_pickup_t'), t('delivery_pickup_s'))}
          </div>
          {method === 'paczkomat' && (
            <div className="mt-3 space-y-2">
              <input className="input w-full" placeholder={t('editor_paczkomat_code')} value={paczCode} onChange={e => setPaczCode(e.target.value)} />
              <input className="input w-full" placeholder={t('editor_paczkomat_name')} value={paczName} onChange={e => setPaczName(e.target.value)} />
            </div>
          )}
          {method === 'courier' && (
            <div className="mt-3 space-y-2">
              <input className="input w-full" placeholder={t('street')} value={street} onChange={e => setStreet(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input w-full" placeholder={t('postal')} value={postal} onChange={e => setPostal(e.target.value)} />
                <input className="input w-full" placeholder={t('city')} value={city} onChange={e => setCity(e.target.value)} />
              </div>
            </div>
          )}
          {method === 'pickup' && <p className="mt-3 text-sm text-gray-600">Coffee Verve, Warszawa</p>}
        </div>

        {/* ── Schedule ── */}
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h3 className="text-xl font-semibold text-[#412618]">{t('editor_schedule_title')}</h3>
          <label className="mt-4 block text-sm text-brand-muted">{t('subs_interval')}</label>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="input mt-1 text-sm">
            {[1, 2, 3, 4, 6, 8].map(w => <option key={w} value={w}>{t('subs_every', { n: w })}</option>)}
          </select>
          <label className="mt-4 block text-sm text-brand-muted">{t('subs_next')}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input mt-1 text-sm" />
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="text-sm font-normal text-gray-500 hover:text-gray-700">{t('subs_cancel_edit')}</button>
          <button type="button" disabled={!canSave || saving} onClick={save}
            className="rounded-full bg-[#412618] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A1810] disabled:opacity-50">
            {saving ? '…' : t('editor_save_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
