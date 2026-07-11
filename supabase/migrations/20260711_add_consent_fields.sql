ALTER TABLE shop_users
ADD COLUMN IF NOT EXISTS consent_terms boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_terms_at timestamptz,
ADD COLUMN IF NOT EXISTS consent_email_marketing boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_email_marketing_at timestamptz,
ADD COLUMN IF NOT EXISTS consent_sms_marketing boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_sms_marketing_at timestamptz;

COMMENT ON COLUMN shop_users.consent_terms IS 'Accepted Terms & Privacy Policy (required)';
COMMENT ON COLUMN shop_users.consent_email_marketing IS 'Opted in to email marketing (optional)';
COMMENT ON COLUMN shop_users.consent_sms_marketing IS 'Opted in to SMS/WhatsApp marketing (optional)';
