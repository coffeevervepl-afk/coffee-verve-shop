import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payment'
import { normalizeTelegramUsername } from '@/lib/telegram'
import type { CartItem, DeliveryType, PricingSummary } from '@/types/shop'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const {
    items,
    customer,
    delivery,
    register,
    pricing,
    promo,
    locale,
    referralCode,     // from localStorage cv_ref
  }: {
    items:        CartItem[]
    customer:     { name: string; email: string; phone?: string; telegram?: string; password?: string; [k: string]: any }
    delivery:     DeliveryType
    register:     boolean
    pricing:      PricingSummary
    promo?:       { id: string; code: string } | null
    locale:       string
    referralCode?: string | null
  } = await req.json()

  // Validate
  if (!items?.length)       return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
  if (!customer?.email)     return NextResponse.json({ error: 'Email required' }, { status: 400 })
  if (!customer?.name)      return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const sb = await createServerSupabase()
  const normalizedTelegram = normalizeTelegramUsername(customer.telegram)

  // 1. Create or find shop_user
  let shopUserId: string | null = null
  {
    const { data: existingUser } = await sb
      .from('shop_users')
      .select('id, discount_pct')
      .eq('email', customer.email)
      .single()

    if (existingUser) {
      shopUserId = existingUser.id
      if (customer.telegram !== undefined) {
        await sb.from('shop_users').update({ telegram: normalizedTelegram ?? null }).eq('id', existingUser.id)
      }
    } else {
      // Check referral
      let referredById: string | null = null
      if (referralCode) {
        const { data: refUser } = await sb
          .from('shop_users')
          .select('id')
          .eq('referral_code', referralCode)
          .single()
        referredById = refUser?.id ?? null
      }

      const { data: newUser } = await sb
        .from('shop_users')
        .insert({
          email:        customer.email,
          phone:        customer.phone ?? null,
          telegram:     normalizedTelegram ?? null,
          name:         customer.name,
          language:     locale as any,
          is_guest:     !register,
          discount_pct: register ? pricing.discount_pct : 0,
          referred_by:  referredById,
        })
        .select('id')
        .single()
      shopUserId = newUser?.id ?? null
    }
  }

  // Mark promo code as used (if applied)
  if (promo?.id && customer.email) {
    await sb.from('shop_promo_codes').update({ used_count: (sb as any).sql`used_count + 1` }).eq('id', promo.id)
  }

  // 2. Build delivery_address snapshot
  const deliveryAddress = delivery === 'paczkomat'
    ? { type: 'paczkomat', paczkomat_id: customer.paczkomat_id, paczkomat_name: customer.paczkomat_name, paczkomat_address: customer.paczkomat_address }
    : delivery === 'courier'
    ? { type: 'courier', street: customer.street, city: customer.city, postal_code: customer.postal_code, country: 'PL' }
    : { type: 'pickup' }

  // 3. Create order
  const { data: order, error: orderError } = await sb
    .from('shop_orders')
    .insert({
      shop_user_id:    shopUserId,
      customer_name:   customer.name,
      customer_email:  customer.email,
      customer_phone:  customer.phone ?? null,
      customer_telegram: normalizedTelegram ?? null,
      delivery_type:   delivery,
      delivery_address: deliveryAddress,
      delivery_cost:   pricing.delivery_cost,
      subtotal:        pricing.subtotal,
      discount_pct:    pricing.discount_pct,
      discount_amount: pricing.discount_amount,
      total:           pricing.total,
      payment_provider: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe',
      payment_status:   'pending',
      status:           'new',
      language:         locale as any,
      notes:            customer.notes ?? null,
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    console.error('Order creation failed:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // 4. Create order items
  const orderItems = items.map(item => ({
    order_id:        order.id,
    shop_product_id: item.product_id,
    product_name:    item.name,
    product_slug:    item.slug,
    weight:          item.weight,
    unit_price:      item.unit_price,
    quantity:        item.qty,
    line_total:      item.unit_price * item.qty,
    grind:           item.grind ?? 'whole',
    grind_option:    item.grindOption ?? null,
  }))

  await sb.from('shop_order_items').insert(orderItems)

  // 5. Create payment session via abstract payment provider
  const successUrl = `${SITE_URL}/${locale}/success?order=${order.id}`
  const cancelUrl  = `${SITE_URL}/${locale}/checkout`

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      orderId:       order.id,
      orderNumber:   order.order_number,
      amount:        pricing.total,
      currency:      'PLN',
      customerEmail: customer.email,
      customerName:  customer.name,
      items:         items.map(i => ({ name: `${i.name} ${i.weight}g`, amount: i.unit_price, quantity: i.qty })),
      successUrl,
      cancelUrl,
      metadata:      {
        orderId: order.id,
        locale,
        register_intent: register ? '1' : '0',
        register_email: register ? customer.email : '',
        register_name: register ? customer.name : '',
        register_phone: register ? (customer.phone ?? '') : '',
        register_password: register ? String(customer.password ?? '') : '',
      },
    })

    // Save payment ref
    await sb
      .from('shop_orders')
      .update({ payment_ref: result.paymentRef })
      .eq('id', order.id)

    return NextResponse.json({ orderId: order.id, redirectUrl: result.redirectUrl })

  } catch (err) {
    // Payment provider not configured (dev mode) — redirect to success directly
    console.warn('Payment provider error (dev mode):', err)
    return NextResponse.json({ orderId: order.id, redirectUrl: successUrl })
  }
}
