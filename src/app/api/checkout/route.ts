import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { getPaymentProvider } from '@/lib/payment'
import { normalizeTelegramUsername } from '@/lib/telegram'
import { validateReferral } from '@/lib/referral'
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
    referralCode,          // from ?ref capture / manual entry
    bonusPackProductId,    // new customer's free 250g pack for using a code
    useBonus,              // referrer redeeming an accumulated bonus
    bonusRedeemProductId,  // sort chosen for the redeemed bonus
  }: {
    items:        CartItem[]
    customer:     { name: string; email: string; phone?: string; telegram?: string; password?: string; [k: string]: any }
    delivery:     DeliveryType
    register:     boolean
    pricing:      PricingSummary
    promo?:       { id: string; code: string } | null
    locale:       string
    referralCode?: string | null
    bonusPackProductId?:   string | null
    useBonus?:             boolean
    bonusRedeemProductId?: string | null
  } = await req.json()

  // Validate
  if (!items?.length)       return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
  if (!customer?.email)     return NextResponse.json({ error: 'Email required' }, { status: 400 })
  if (!customer?.name)      return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Service-role client: checkout must SELECT (find user by email) + INSERT +
  // UPDATE shop_users/shop_orders. Runs server-side with no user session
  // (guests included), so it bypasses RLS instead of relying on open anon
  // policies (which are being locked down). service_role never leaves the server.
  const sb = createServiceSupabase()
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
  const CUSTOM_GRIND_SURCHARGE = 3 // zł per 250g pack when ground
  // Shared row shape so both flatMap branches (custom bundle vs normal item)
  // unify — otherwise TS infers the element type from the first branch and the
  // other branch's differing field types (string vs null, etc.) fail to assign.
  type OrderItemRow = {
    order_id:            string
    shop_product_id:     string | null
    product_name:        string
    product_slug:        string | null
    weight:              number
    unit_price:          number
    quantity:            number
    line_total:          number
    grind:               'whole' | 'ground'
    grind_option:        string | null
    custom_bundle_group: string | null
  }
  const orderItems = items.flatMap((item): OrderItemRow[] => {
    if (item.customBundle?.items?.length) {
      // Custom bundle -> one row per selected sort, sharing a group id so the CRM
      // groups them and each sort goes through the normal finished-goods write-off.
      const groupId  = crypto.randomUUID()
      const surcharge = item.grind === 'ground' ? CUSTOM_GRIND_SURCHARGE : 0
      return item.customBundle.items.map((ci): OrderItemRow => ({
        order_id:            order.id,
        shop_product_id:     ci.product_id,
        product_name:        ci.name,
        product_slug:        null,
        weight:              ci.weight,
        unit_price:          ci.price + surcharge,
        quantity:            1,
        line_total:          ci.price + surcharge,
        grind:               item.grind ?? 'whole',
        grind_option:        item.grindOption ?? null,
        custom_bundle_group: groupId,
      }))
    }
    return [{
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
      custom_bundle_group: null,
    }]
  })

  await sb.from('shop_order_items').insert(orderItems)

  // 4b. Referral bonuses — add free 250g pack(s) and record the referral.
  try {
    const bonusItems: OrderItemRow[] = []
    const orderUpdate: Record<string, unknown> = {}

    const freePack = (productId: string, name: string, slug: string | null): OrderItemRow => ({
      order_id:            order.id,
      shop_product_id:     productId,
      product_name:        `🎁 ${name}`,
      product_slug:        slug,
      weight:              250,
      unit_price:          0,
      quantity:            1,
      line_total:          0,
      grind:               'whole',
      grind_option:        null,
      custom_bundle_group: null,
    })

    // New customer using a friend's code → free pack + record referral_code_used
    // (the delivered-order trigger later awards the referrer their bonus).
    if (referralCode && bonusPackProductId) {
      const check = await validateReferral(sb, referralCode, customer.email, pricing.subtotal, order.id)
      if (check.valid) {
        const { data: prod } = await sb.from('shop_products').select('name_ru, slug').eq('id', bonusPackProductId).maybeSingle()
        if (prod) {
          orderUpdate.referral_code_used = referralCode
          orderUpdate.referral_bonus_pack_product_id = bonusPackProductId
          bonusItems.push(freePack(bonusPackProductId, prod.name_ru, prod.slug ?? null))
        }
      }
    }

    // Referrer redeeming an accumulated bonus → free pack + mark bonus used.
    if (useBonus && bonusRedeemProductId && shopUserId) {
      const { data: su } = await sb.from('shop_users').select('auth_user_id').eq('id', shopUserId).maybeSingle()
      const uid = su?.auth_user_id
      if (uid) {
        const { data: avail } = await sb.from('referral_bonuses')
          .select('id')
          .eq('user_id', uid)
          .eq('status', 'available')
          .order('expires_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (avail) {
          const { data: prod } = await sb.from('shop_products').select('name_ru, slug').eq('id', bonusRedeemProductId).maybeSingle()
          if (prod) {
            bonusItems.push(freePack(bonusRedeemProductId, prod.name_ru, prod.slug ?? null))
            await sb.from('referral_bonuses').update({ status: 'used', used_in_order_id: order.id, used_at: new Date().toISOString() }).eq('id', avail.id)
            orderUpdate.is_referrer_bonus_applied = true
          }
        }
      }
    }

    if (bonusItems.length) await sb.from('shop_order_items').insert(bonusItems)
    if (Object.keys(orderUpdate).length) await sb.from('shop_orders').update(orderUpdate).eq('id', order.id)
  } catch (e) {
    console.warn('Referral bonus handling failed:', e)
  }

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

    // Save payment ref (same service-role client as the rest of checkout).
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
