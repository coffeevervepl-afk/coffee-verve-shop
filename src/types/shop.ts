export type Locale = 'ru' | 'pl' | 'ua'

export type ProductWeight = 250 | 500 | 1000

export interface ShopProduct {
  id: string
  crm_product_id: string | null
  slug: string
  name_ru: string
  name_pl: string
  name_ua: string
  description_ru: string | null
  description_pl: string | null
  description_ua: string | null
  flavor_notes_ru: string | null
  flavor_notes_pl: string | null
  flavor_notes_ua: string | null
  origin: string | null
  process: string | null
  roast_level: 'light' | 'medium' | 'medium-dark' | 'dark' | null
  brew_method: string[] | null
  price_250: number
  price_500: number | null
  price_1000: number | null
  old_price_1000: number | null
  images: string[]
  video_url: string | null
  is_active: boolean
  is_featured: boolean
  sort_order: number
  body?: number | null
  acidity?: number | null
  altitude?: string | null
  variety?: string | null
  sca_score?: number | null
  caffeine?: string | null
  roaster?: string | null
  // Catalog-filter fields (Phase 1)
  country?: string | null
  is_decaf: boolean
  is_blend: boolean
  flavor_tags: string[]
  // DB columns previously missing from this type
  stock_status: string
  old_price_250: number | null
  old_price_500: number | null
  created_at: string
  updated_at?: string
  seo_title?: string | null
  seo_description?: string | null
}

export interface CartItem {
  product_id: string
  slug: string
  name: string           // resolved for current locale
  image: string
  weight: ProductWeight
  grind?: 'whole' | 'ground'
  grindOption?: string
  unit_price: number
  qty: number
}

export interface Cart {
  id: string
  session_id: string
  shop_user_id: string | null
  items: CartItem[]
  updated_at: string
}

export type DeliveryType = 'paczkomat' | 'courier' | 'pickup'

export interface DeliveryAddress {
  type: DeliveryType
  // paczkomat
  paczkomat_id?: string
  paczkomat_name?: string
  paczkomat_address?: string
  // courier
  street?: string
  city?: string
  postal_code?: string
  country?: string
}

export interface CheckoutFormData {
  name: string
  email: string
  phone: string
  telegram?: string
  delivery: DeliveryAddress
  notes?: string
  register?: boolean
  password?: string
}

export type PaymentProvider = 'stripe' | 'przelewy24' | 'blik'
export type PaymentStatus  = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus    = 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface ShopOrder {
  id: string
  order_number: number
  shop_user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_telegram: string | null
  delivery_type: DeliveryType
  delivery_address: DeliveryAddress
  delivery_cost: number
  subtotal: number
  discount_pct: number
  discount_amount: number
  total: number
  payment_provider: PaymentProvider
  payment_status: PaymentStatus
  payment_ref: string | null
  status: OrderStatus
  tracking_number: string | null
  language: Locale
  notes: string | null
  created_at: string
}

export interface ShopOrderItem {
  id: string
  order_id: string
  shop_product_id: string | null
  product_name: string
  product_slug: string | null
  weight: ProductWeight
  unit_price: number
  quantity: number
  line_total: number
}

export interface PricingSummary {
  subtotal: number
  discount_pct: number
  discount_amount: number
  delivery_cost: number
  total: number
  is_free_delivery: boolean
  free_delivery_threshold: number
}
