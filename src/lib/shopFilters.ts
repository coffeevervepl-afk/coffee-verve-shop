import type { ShopProduct } from '@/types/shop'

// Client-side catalog facets. Predicates map to real shop_products columns:
// acidity (1-5), body (=density, 1-5), roast_level, flavor_tags[], is_decaf,
// is_blend. No 'use client' — shared by FilterPanel and CatalogLayout.
export interface FilterOption {
  id:       string                       // unique across all groups
  labelKey: string                       // i18n key under shop.filters
  match:    (p: ShopProduct) => boolean
}
export interface FilterGroup {
  id:       string
  titleKey: string
  options:  FilterOption[]
}

const inRange = (v: number | null | undefined, lo: number, hi: number) => v != null && v >= lo && v <= hi
const hasTag  = (p: ShopProduct, tags: string[]) => (p.flavor_tags ?? []).some(x => tags.includes(x))

export const FILTER_GROUPS: FilterGroup[] = [
  { id: 'acidity', titleKey: 'acidity', options: [
    { id: 'acidity_low',  labelKey: 'low',    match: p => inRange(p.acidity, 1, 2) },
    { id: 'acidity_mid',  labelKey: 'medium', match: p => p.acidity === 3 },
    { id: 'acidity_high', labelKey: 'high',   match: p => inRange(p.acidity, 4, 5) },
  ] },
  { id: 'density', titleKey: 'density', options: [
    { id: 'density_low',  labelKey: 'low',    match: p => inRange(p.body, 1, 2) },
    { id: 'density_mid',  labelKey: 'medium', match: p => p.body === 3 },
    { id: 'density_high', labelKey: 'high',   match: p => inRange(p.body, 4, 5) },
  ] },
  { id: 'roast', titleKey: 'roast', options: [
    { id: 'roast_light',  labelKey: 'light',        match: p => p.roast_level === 'light' },
    { id: 'roast_medium', labelKey: 'medium_roast', match: p => p.roast_level === 'medium' },
    { id: 'roast_dark',   labelKey: 'dark',         match: p => p.roast_level === 'dark' || p.roast_level === 'medium-dark' },
  ] },
  { id: 'flavor', titleKey: 'flavor', options: [
    { id: 'flavor_choco',   labelKey: 'flavor_choco',   match: p => hasTag(p, ['chocolate', 'nuts']) },
    { id: 'flavor_fruit',   labelKey: 'flavor_fruit',   match: p => hasTag(p, ['fruit', 'berries']) },
    { id: 'flavor_citrus',  labelKey: 'flavor_citrus',  match: p => hasTag(p, ['citrus', 'floral']) },
    { id: 'flavor_caramel', labelKey: 'flavor_caramel', match: p => hasTag(p, ['caramel', 'honey', 'vanilla']) },
  ] },
  { id: 'features', titleKey: 'features', options: [
    { id: 'feat_decaf',  labelKey: 'feat_decaf',  match: p => p.is_decaf === true },
    { id: 'feat_blend',  labelKey: 'feat_blend',  match: p => p.is_blend === true },
    { id: 'feat_single', labelKey: 'feat_single', match: p => p.is_blend === false },
  ] },
]

// A product passes a group if it matches ANY selected option (OR); an inactive
// group (nothing selected) passes everything.
function passesGroup(p: ShopProduct, group: FilterGroup, selected: Set<string>): boolean {
  const sel = group.options.filter(o => selected.has(o.id))
  return sel.length === 0 || sel.some(o => o.match(p))
}

// Visible products = pass ALL groups (AND between groups).
export function filterProducts(products: ShopProduct[], selected: Set<string>): ShopProduct[] {
  if (selected.size === 0) return products
  return products.filter(p => FILTER_GROUPS.every(g => passesGroup(p, g, selected)))
}

// Facet count for one option: products matching it, given the active filters in
// every OTHER group (its own group is ignored so counts reflect "if I add this").
export function optionCount(
  products: ShopProduct[],
  group: FilterGroup,
  option: FilterOption,
  selected: Set<string>,
): number {
  return products.filter(
    p => option.match(p) && FILTER_GROUPS.every(g => g.id === group.id || passesGroup(p, g, selected)),
  ).length
}
