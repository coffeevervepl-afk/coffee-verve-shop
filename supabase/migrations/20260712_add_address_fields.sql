-- shop_users.name already exists — no migration needed for it.
-- shop_addresses is missing fields required by the account settings
-- address form (label like "Дом"/"Работа", recipient name/phone).
ALTER TABLE shop_addresses
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS recipient_phone text;

COMMENT ON COLUMN shop_addresses.label IS 'User-facing address label, e.g. "Дом", "Работа"';
COMMENT ON COLUMN shop_addresses.recipient_name IS 'Name of the person receiving deliveries at this address';
COMMENT ON COLUMN shop_addresses.recipient_phone IS 'Phone number of the recipient at this address';
