import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton: every call site must share ONE client instance.
// Multiple independently-created GoTrueClient instances don't notify each
// other's onAuthStateChange listeners for actions taken on a *different*
// instance within the same tab (only cross-tab storage events do that) —
// so signing in via a fresh client here left useAuth()'s listener (and
// therefore the header/account pages) unaware that a session now exists.
let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}
