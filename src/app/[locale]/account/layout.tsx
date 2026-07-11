'use client'

import { useEffect } from 'react'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const authPage =
    pathname?.endsWith('/login') ||
    pathname?.endsWith('/register') ||
    pathname?.endsWith('/forgot-password') ||
    pathname?.endsWith('/reset-password')
  const isResetPasswordPage = pathname?.endsWith('/reset-password')

  useEffect(() => {
    // TEMP DEBUG: guard redirect disabled to diagnose why useAuth() returns user=null
    // if (!loading && !user && !authPage) {
    //   router.replace(`/${locale}/account/login`)
    // }
  }, [loading, user, authPage, locale, router])

  useEffect(() => {
    if (!loading && user && authPage && !isResetPasswordPage) {
      router.replace(`/${locale}/account`)
    }
  }, [loading, user, authPage, isResetPasswordPage, locale, router])

  if (!authPage && loading) {
    return (
      <div className="container py-20 text-center text-brand-muted">Загрузка…</div>
    )
  }

  return <div className="container py-10">{children}</div>
}
