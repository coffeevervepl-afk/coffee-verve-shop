'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/shop'

export default function LogoutFooter({ locale }: { locale: Locale }) {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function logout() {
    setBusy(true)
    await createClient().auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <div className="pt-2 text-center">
      <button type="button" onClick={logout} disabled={busy} className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50">
        {t('logout')}
      </button>
    </div>
  )
}
