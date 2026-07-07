-- Migration: sync non-guest shop users to CRM clients and backfill crm_client_id

CREATE OR REPLACE FUNCTION sync_shop_user_to_crm()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_has_source boolean;
  v_has_created_at boolean;
BEGIN
  -- Only for registered (non-guest) users without CRM link
  IF NEW.is_guest = false AND NEW.crm_client_id IS NULL THEN
    -- Reuse an existing CRM client by email if present
    SELECT id
      INTO v_client_id
      FROM clients
     WHERE email = NEW.email
     LIMIT 1;

    IF v_client_id IS NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'source'
      ) INTO v_has_source;

      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_at'
      ) INTO v_has_created_at;

      IF v_has_source AND v_has_created_at THEN
        INSERT INTO clients (name, email, phone, source, created_at)
        VALUES (
          COALESCE(NEW.name, NEW.email),
          NEW.email,
          NEW.phone,
          'shop_registration',
          NOW()
        )
        RETURNING id INTO v_client_id;
      ELSIF v_has_source THEN
        INSERT INTO clients (name, email, phone, source)
        VALUES (
          COALESCE(NEW.name, NEW.email),
          NEW.email,
          NEW.phone,
          'shop_registration'
        )
        RETURNING id INTO v_client_id;
      ELSIF v_has_created_at THEN
        INSERT INTO clients (name, email, phone, created_at)
        VALUES (
          COALESCE(NEW.name, NEW.email),
          NEW.email,
          NEW.phone,
          NOW()
        )
        RETURNING id INTO v_client_id;
      ELSE
        INSERT INTO clients (name, email, phone)
        VALUES (
          COALESCE(NEW.name, NEW.email),
          NEW.email,
          NEW.phone
        )
        RETURNING id INTO v_client_id;
      END IF;
    ELSE
      UPDATE clients
         SET name = COALESCE(NEW.name, clients.name),
             phone = COALESCE(NEW.phone, clients.phone)
       WHERE id = v_client_id;
    END IF;

    NEW.crm_client_id := v_client_id;
    UPDATE shop_users
       SET crm_client_id = NEW.crm_client_id
     WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_shop_user_to_crm ON shop_users;

CREATE TRIGGER trg_shop_user_to_crm
  AFTER INSERT OR UPDATE OF is_guest ON shop_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_shop_user_to_crm();
