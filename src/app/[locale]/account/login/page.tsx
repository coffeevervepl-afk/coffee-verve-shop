'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const t = useTranslations('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const sb = createClient()
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(`/${locale}/account`)
    } catch (err: any) {
      toast.error(err?.message || t('login_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{t('login_title')}</h1>
      <p className="text-sm text-brand-muted mb-6">{t('login_subtitle')}</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input mt-2 w-full"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('password')}</span>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input mt-2 w-full"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? '…' : t('login_button')}
        </button>
      </form>
      <div className="mt-6 text-sm text-brand-muted">
        {t('no_account')}{' '}
        <Link href={`/${locale}/account/register`} className="text-brand-accent underline">
          {t('register_link')}
        </Link>
      </div>
    </div>
  )
}
