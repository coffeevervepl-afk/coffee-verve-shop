'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SessionUser } from '@/lib/supabase/auth'

interface AuthState {
  user:    SessionUser | null
  loading: boolean
  config:  Record<string, number>
}

export function useAuth(): AuthState & {
  refresh:  () => Promise<void>
  signOut:  () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, config: {} })
  const sb = createClient()

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const { data: { session } } = await sb.auth.getSession()
    if (!session?.user?.email) {
      setState({ user: null, loading: false, config: {} })
      return
    }
    const [userRes, configRes] = await Promise.all([
      sb.from('shop_users')
        .select('id,email,name,loyalty_level,spent_12m,referral_code,taste_profile,birthday,is_b2b,b2b_discount,min_discount_until,last_purchase_at')
        .eq('email', session.user.email)
        .single(),
      sb.from('loyalty_config').select('key,value'),
    ])
    const config: Record<string, number> = {}
    for (const r of configRes.data ?? []) config[r.key] = Number(r.value)

    setState({ user: userRes.data as SessionUser | null, loading: false, config })
  }, [sb])

  useEffect(() => {
    refresh()
    const { data: { subscription } } = sb.auth.onAuthStateChange(() => refresh())
    return () => subscription.unsubscribe()
  }, [refresh, sb])

  const signOut = async () => {
    await sb.auth.signOut()
    setState({ user: null, loading: false, config: {} })
  }

  return { ...state, refresh, signOut }
}
