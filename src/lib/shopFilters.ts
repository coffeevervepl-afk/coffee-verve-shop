import type { ShopProduct } from '@/types/shop'

// Client-side catalog facets. Predicates map to real shop_products columns:
// acidity (1-5), body (=density, 1-5), roast_level, country, flavor_tags[],
// is_decaf, is_blend. No 'use client' — shared by FilterPanel and CatalogLayout.
export interface FilterOption {
  id:        string                      // unique across all groups
  labelKey?: string                      // i18n key under shop.filters (static options)
  label?:    string                      // raw label (dynamic country options — not translated)
  match:     (p: ShopProduct) => boolean
}
export interface FilterGroup {
  id:         string
  titleKey:   string
  tooltipKey: string                     // i18n key under shop.filters.tooltip
  options:    FilterOption[]
}

const inRange = (v: number | null | undefined, lo: number, hi: number) => v != null && v >= lo && v <= hi
const hasTag  = (p: ShopProduct, tags: string[]) => (p.flavor_tags ?? []).some(x => tags.includes(x))

const ACIDITY: FilterGroup = { id: 'acidity', titleKey: 'acidity', tooltipKey: 'acidity', options: [
  { id: 'acidity_low',  labelKey: 'low',    match: p => inRange(p.acidity, 1, 2) },
  { id: 'acidity_mid',  labelKey: 'medium', match: p => p.acidity === 3 },
  { id: 'acidity_high', labelKey: 'high',   match: p => inRange(p.acidity, 4, 5) },
] }
const DENSITY: FilterGroup = { id: 'density', titleKey: 'density', tooltipKey: 'density', options: [
  { id: 'density_low',  labelKey: 'low',    match: p => inRange(p.body, 1, 2) },
  { id: 'density_mid',  labelKey: 'medium', match: p => p.body === 3 },
  { id: 'density_high', labelKey: 'high',   match: p => inRange(p.body, 4, 5) },
] }
const ROAST: FilterGroup = { id: 'roast', titleKey: 'roast', tooltipKey: 'roast', options: [
  { id: 'roast_light',  labelKey: 'light',        match: p => p.roast_level === 'light' },
  { id: 'roast_medium', labelKey: 'medium_roast', match: p => p.roast_level === 'medium' },
  { id: 'roast_dark',   labelKey: 'dark',         match: p => p.roast_level === 'dark' || p.roast_level === 'medium-dark' },
] }
const FLAVOR: FilterGroup = { id: 'flavor', titleKey: 'flavor', tooltipKey: 'flavor', options: [
  { id: 'flavor_choco',   labelKey: 'flavor_choco',   match: p => hasTag(p, ['chocolate', 'nuts']) },
  { id: 'flavor_fruit',   labelKey: 'flavor_fruit',   match: p => hasTag(p, ['fruit', 'berries']) },
  { id: 'flavor_citrus',  labelKey: 'flavor_citrus',  match: p => hasTag(p, ['citrus', 'floral']) },
  { id: 'flavor_caramel', labelKey: 'flavor_caramel', match: p => hasTag(p, ['caramel', 'honey', 'vanilla']) },
] }
const FEATURES: FilterGroup = { id: 'features', titleKey: 'features', tooltipKey: 'features', options: [
  { id: 'feat_decaf',  labelKey: 'feat_decaf',  match: p => p.is_decaf === true },
  { id: 'feat_blend',  labelKey: 'feat_blend',  match: p => p.is_blend === true },
  { id: 'feat_single', labelKey: 'feat_single', match: p => p.is_blend === false },
] }

// Country is dynamic — options come from the loaded products (not hard-coded),
// so they appear automatically as managers fill `country` in the CRM. Names are
// shown raw (not translated). Inserted between Roast and Flavor; omitted if empty.
function countryGroup(products: ShopProduct[]): FilterGroup | null {
  const names = Array.from(
    new Set(products.map(p => p.country?.trim()).filter((c): c is string => !!c)),
  ).sort((a, b) => a.localeCompare(b))
  if (names.length === 0) return null
  return {
    id: 'country', titleKey: 'country', tooltipKey: 'country',
    options: names.map(c => ({ id: `country_${c}`, label: c, match: p => p.country?.trim() === c })),
  }
}

export function getFilterGroups(products: ShopProduct[]): FilterGroup[] {
  const country = countryGroup(products)
  return [ACIDITY, DENSITY, ROAST, ...(country ? [country] : []), FLAVOR, FEATURES]
}

// A product passes a group if it matches ANY selected option (OR); an inactive
// group (nothing selected) passes everything.
function passesGroup(p: ShopProduct, group: FilterGroup, selected: Set<string>): boolean {
  const sel = group.options.filter(o => selected.has(o.id))
  return sel.length === 0 || sel.some(o => o.match(p))
}

// Visible products = pass ALL groups (AND between groups).
export function filterProducts(products: ShopProduct[], selected: Set<string>): ShopProduct[] {
  if (selected.size === 0) return products
  const groups = getFilterGroups(products)
  return products.filter(p => groups.every(g => passesGroup(p, g, selected)))
}

// Facet count for one option: products matching it, given the active filters in
// every OTHER group (its own group is ignored so counts reflect "if I add this").
export function optionCount(
  products: ShopProduct[],
  groups: FilterGroup[],
  group: FilterGroup,
  option: FilterOption,
  selected: Set<string>,
): number {
  return products.filter(
    p => option.match(p) && groups.every(g => g.id === group.id || passesGroup(p, g, selected)),
  ).length
}
