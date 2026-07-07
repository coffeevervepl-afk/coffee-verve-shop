'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('account')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const sb = createClient()
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://coffeeverve.pl/ru/account/reset-password',
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      toast.error(err?.message || t('forgot_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{t('forgot_title')}</h1>
      <p className="text-sm text-brand-muted mb-6">{t('forgot_subtitle')}</p>

      {sent ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t('forgot_sent')}
        </div>
      ) : (
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
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? '…' : t('forgot_submit')}
          </button>
        </form>
      )}

      <div className="mt-6 text-sm text-brand-muted">
        <Link href={`/${locale}/account/login`} className="text-brand-accent underline">
          {t('back_to_login')}
        </Link>
      </div>
    </div>
  )
}
