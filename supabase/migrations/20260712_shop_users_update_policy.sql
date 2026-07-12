-- Root-cause fix: profile edits (PATCH /api/account/profile) silently did
-- nothing. shop_users has RLS enabled with only INSERT and SELECT policies —
-- there was NO UPDATE policy. With RLS on and no UPDATE policy, an UPDATE via
-- the anon PostgREST client matches 0 rows and returns NO error, so the route
-- saw success and returned { ok: true } while nothing was written.
--
-- The register/checkout guest->registered UPDATE paths were silently failing
-- for the same reason.
--
-- Add an UPDATE policy consistent with the table's existing fully-open posture
-- (shop_users_insert = WITH CHECK true, shop_users_select = USING true).
-- Real authorization is enforced server-side: every route re-derives the row
-- to touch from the authenticated user's email before updating.

CREATE POLICY shop_users_update ON public.shop_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
