import { createClient } from '@supabase/supabase-js'

/**
 * ⚠️ SERVICE-ROLE Supabase client — BYPASSES Row Level Security (RLS).
 *
 * Authenticates with SUPABASE_SERVICE_ROLE_KEY, so it has unrestricted
 * read/write to every table and ignores ALL RLS policies.
 *
 * HARD RULES:
 *  - NEVER import this from a client component, browser code, or anything that
 *    ends up in the client bundle. The service-role key must never reach the
 *    browser. (Note: it is NOT a NEXT_PUBLIC_ var, so importing it client-side
 *    would fail at runtime anyway — but do not rely on that as the guard.)
 *  - Use it ONLY inside trusted server route handlers where the caller has been
 *    authenticated by another mechanism first — e.g. the payment webhook, which
 *    cryptographically verifies the provider's signature BEFORE any DB write.
 *
 * For normal request-scoped access that must respect RLS (user session / anon),
 * use createServerSupabase() from './server' instead.
 */
export function createServiceSupabase() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('createServiceSupabase: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
