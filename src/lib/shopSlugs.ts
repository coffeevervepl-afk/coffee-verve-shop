import type { ShopProduct } from '@/types/shop'
import { brewMethods } from '@/lib/shopTags'

// SEO landing slugs for /shop/[tag]. Each slug is its own indexable page with a
// dedicated filter, i18n key (shop.seo.<key>.{title,description,h1}) and — for
// attribute tags — a chip label (shop.tags.<chip>) shown in the filter row.
// No 'use client' here so the server route can filter and generate metadata.
export interface SlugDef {
  slug:   string                        // URL segment
  key:    string                        // i18n key under shop.seo.<key>
  filter: (p: ShopProduct) => boolean
  chip?:  string                        // shop.tags.<chip> label; set => shown as a filter chip
}

const hasBrew = (p: ShopProduct, m: string) => brewMethods(p).includes(m)
const MS_30D  = 30 * 24 * 3600 * 1000
const isNew   = (p: ShopProduct) => {
  const ts = new Date(p.created_at).getTime()
  return Number.isFinite(ts) && Date.now() - ts <= MS_30D
}

export const SHOP_SLUGS: SlugDef[] = [
  // Categories (video tiles) — no chip.
  { slug: 'espresso',         key: 'espresso',       filter: p => hasBrew(p, 'espresso') },
  { slug: 'filter',           key: 'filter',         filter: p => hasBrew(p, 'filter') },
  { slug: 'decaf',            key: 'decaf',          filter: p => p.is_decaf === true },
  // Attribute tags (filter chips).
  { slug: 'do-ekspresu',      key: 'doEkspresu',     filter: p => hasBrew(p, 'espresso'),    chip: 'ekspres' },
  { slug: 'do-turki',         key: 'doTurki',        filter: p => hasBrew(p, 'turka'),       chip: 'turka' },
  { slug: 'do-mlecznych',     key: 'doMlecznych',    filter: p => hasBrew(p, 'espresso'),    chip: 'milk' },
  { slug: 'do-pourouvera',    key: 'doPourovera',    filter: p => hasBrew(p, 'filter'),      chip: 'pourover' },
  { slug: 'do-aeropressu',    key: 'doAeropressu',   filter: p => hasBrew(p, 'aeropress'),   chip: 'aeropress' },
  { slug: 'do-french-pressu', key: 'doFrenchPressu', filter: p => hasBrew(p, 'frenchpress'), chip: 'frenchpress' },
  { slug: 'do-filizanki',     key: 'doFilizanki',    filter: p => hasBrew(p, 'cup'),         chip: 'cup' },
  { slug: 'ziarnista',        key: 'ziarnista',      filter: () => true,                     chip: 'ziarnista' },
  { slug: 'mielona',          key: 'mielona',        filter: () => true,                     chip: 'mielona' },
  { slug: '1kg',              key: 'kg1',            filter: p => p.price_1000 != null,      chip: 'kg1' },
  { slug: 'bezkofeinowa',     key: 'bezkofeinowa',   filter: p => p.is_decaf === true,       chip: 'decaf' },
  { slug: 'niska-kwasowosc',  key: 'niskaKwasowosc', filter: p => p.acidity != null && p.acidity <= 2, chip: 'lowacid' },
  { slug: 'nowosci',          key: 'nowosci',        filter: p => isNew(p),                  chip: 'new' },
]

export const SLUG_MAP: Record<string, SlugDef> =
  Object.fromEntries(SHOP_SLUGS.map(s => [s.slug, s]))

// Chips rendered in the tag-filter row (attribute tags only, not the categories).
export const TAG_CHIPS: { slug: string; chip: string }[] =
  SHOP_SLUGS.filter(s => s.chip).map(s => ({ slug: s.slug, chip: s.chip! }))

export const COLLAPSED_TAGS = 3   // first N chips visible; rest behind "ещё ▼"
