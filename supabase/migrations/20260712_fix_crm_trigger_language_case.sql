-- Root-cause fix for registrations landing in auth.users but not shop_users.
--
-- sync_shop_user_to_crm() copies shop_users.language into clients.language.
-- shop_users.language is lowercase ('ru'|'pl'|'ua'), but clients has a
-- check constraint clients_language_check requiring UPPERCASE ('RU'|'PL'|'UA').
-- So every is_guest=false insert/update raised
--   "new row for relation \"clients\" violates check constraint \"clients_language_check\""
-- which rolled back the shop_users write. The register route didn't check the
-- insert error and proceeded to auth.signUp(), orphaning the auth user.
--
-- Fix: uppercase the language when writing to clients. UPPER(NULL) = NULL,
-- and clients.language is nullable, so a missing language stays NULL.

CREATE OR REPLACE FUNCTION public.sync_shop_user_to_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_id uuid;
BEGIN
  IF NEW.is_guest = false AND NEW.crm_client_id IS NULL THEN
    -- Ищем существующего клиента по email
    SELECT id INTO v_client_id FROM clients WHERE email = NEW.email LIMIT 1;

    IF v_client_id IS NULL THEN
      -- Создаём нового клиента в CRM
      INSERT INTO clients (name, email, phone, language, source, created_at)
      VALUES (
        COALESCE(NEW.name, NEW.email),
        NEW.email,
        NEW.phone,
        UPPER(NEW.language),
        'shop_registration',
        NOW()
      )
      RETURNING id INTO v_client_id;
    ELSE
      -- Обновляем существующего
      UPDATE clients SET
        name = COALESCE(NEW.name, name),
        phone = COALESCE(NEW.phone, phone),
        language = COALESCE(UPPER(NEW.language), language)
      WHERE id = v_client_id;
    END IF;

    -- Прописываем crm_client_id в shop_users
    UPDATE shop_users SET crm_client_id = v_client_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;
