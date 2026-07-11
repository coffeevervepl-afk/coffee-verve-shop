'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'

const languages = [
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
  { value: 'ua', label: 'Українська' },
]

export default function RegisterPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('account')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState(locale)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      setRegistered(true)
      toast.success(t('register_check_email'))
    } catch (err: any) {
      toast.error(err?.message || t('register_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{t('register_title')}</h1>

      {registered ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 text-center">
          <p className="mb-2 text-lg font-semibold">{t('register_check_email')}</p>
          <p className="text-sm text-brand-muted">{email}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href={`/${locale}`} className="btn btn-primary">
              {t('go_home')}
            </Link>
            <Link href={`/${locale}/account/login`} className="btn btn-outline">
              {t('login_link')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-brand-muted mb-6">{t('register_subtitle')}</p>
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
              <span className="text-brand-muted">{t('name')}</span>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="input mt-2 w-full"
                placeholder={t('name_placeholder')}
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('phone')}</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input mt-2 w-full"
                placeholder="+48 123 456 789"
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('password')}</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input mt-2 w-full"
                placeholder="••••••••"
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('language')}</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="input mt-2 w-full"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? '…' : t('register_button')}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-sm text-brand-muted">
        {t('have_account')}{' '}
        <Link href={`/${locale}/account/login`} className="text-brand-accent underline">
          {t('login_link')}
        </Link>
      </div>
    </div>
  )
}
