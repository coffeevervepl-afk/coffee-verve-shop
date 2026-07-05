alter table shop_users
  add column if not exists telegram text;

alter table shop_orders
  add column if not exists customer_telegram text;
