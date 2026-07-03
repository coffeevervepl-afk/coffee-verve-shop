# Coffee Verve Shop

## Project context
- Public storefront for Coffee Verve specialty coffee.
- Audience: Ukrainian, Russian, Belarusian customers in Poland.
- Shared Supabase project with CRM: https://dedxdwxqnmizupebaasx.supabase.co
- Hosting: Vercel https://coffee-verve-shop.vercel.app
- Domain: coffeeverve.pl

## Stack
- Next.js 14 + TypeScript
- Supabase PostgreSQL
- next-intl for RU/PL/UA
- GitHub repository: https://github.com/coffeevervepl-afk/coffee-verve-shop

## Supabase data model
- shop_products
- shop_orders
- shop_order_items
- shop_carts
- shop_users
- shop_reviews
- shop_promo_codes
- shop_discounts
- leads

## Business rules
- Loyalty system is already implemented in the app and CRM integration.
- Orders should be written to shop_orders / shop_order_items.
- Product media should be stored and referenced from Supabase-compatible sources.
- Webhooks should notify N8N/CRM where applicable.

## Working rules
- Keep changes minimal and focused.
- Do not introduce unrelated features.
- Prefer fixes and incremental improvements.
- Preserve current i18n structure and existing routes.
