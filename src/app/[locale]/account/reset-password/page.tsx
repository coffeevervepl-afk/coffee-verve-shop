'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function ResetPasswordPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const t = useTranslations('account')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 6) {
      toast.error(t('reset_password_min'))
      return
    }
    if (password !== confirmPassword) {
      toast.error(t('reset_mismatch'))
      return
    }

    setLoading(true)
    try {
      const sb = createClient()
      const { error } = await sb.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push(`/${locale}/account/login`), 3000)
    } catch (err: any) {
      toast.error(err?.message || t('reset_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{t('reset_title')}</h1>

      {done ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t('reset_success')}
        </div>
      ) : (
        <>
          <p className="text-sm text-brand-muted mb-6">{t('reset_subtitle')}</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('reset_new_password')}</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input mt-2 w-full"
                placeholder="••••••"
              />
            </label>

            <label className="block text-sm">
              <span className="text-brand-muted">{t('reset_repeat_password')}</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input mt-2 w-full"
                placeholder="••••••"
              />
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? '…' : t('reset_submit')}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
