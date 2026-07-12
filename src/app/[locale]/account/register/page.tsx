'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'

const languages = [
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
  { value: 'ua', label: 'Українська' },
]

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DOMAIN_TYPOS: Record<string, string> = {
  gmaal:   'gmail',
  gmai:    'gmail',
  iclod:   'icloud',
  iclould: 'icloud',
  yaho:    'yahoo',
  hotmal:  'hotmail',
  outook:  'outlook',
}

function suggestEmailFix(value: string): string | null {
  const domain = value.split('@')[1]
  if (!domain || !domain.includes('.')) return null
  const [domainName, ...rest] = domain.split('.')
  const fixedName = DOMAIN_TYPOS[domainName.toLowerCase()]
  if (!fixedName) return null
  return `${value.split('@')[0]}@${fixedName}.${rest.join('.')}`
}

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
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentEmailMarketing, setConsentEmailMarketing] = useState(false)
  const [consentSmsMarketing, setConsentSmsMarketing] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)

  function validateEmail(value: string): boolean {
    if (!value) {
      setEmailError('')
      setEmailSuggestion(null)
      return true
    }
    if (!EMAIL_FORMAT.test(value)) {
      setEmailError(t('email_invalid'))
      setEmailSuggestion(null)
      return false
    }
    setEmailError('')
    setEmailSuggestion(suggestEmailFix(value))
    return true
  }

  function applyEmailSuggestion() {
    if (!emailSuggestion) return
    setEmail(emailSuggestion)
    setEmailSuggestion(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateEmail(email)) return
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, name, phone, language,
          consent_terms: consentTerms,
          consent_email_marketing: consentEmailMarketing,
          consent_sms_marketing: consentSmsMarketing,
        }),
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
    <div className="relative mx-auto max-w-xl rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <Link
        href={`/${locale}`}
        aria-label="Close"
        className="absolute right-4 top-4 text-[#4A4540] transition-colors duration-150 hover:text-[#2A2620]"
      >
        <X size={24} />
      </Link>
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
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <label className="block text-sm">
              <span className="text-brand-muted">{t('email')}</span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => validateEmail(e.target.value)}
                className="input mt-2 w-full"
                placeholder="you@example.com"
                autoComplete="new-email"
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
              {emailSuggestion && (
                <p className="mt-1 text-xs text-brand-muted">
                  {t('email_typo_suggestion', { email: emailSuggestion })}{' '}
                  <button
                    type="button"
                    onClick={applyEmailSuggestion}
                    className="font-semibold text-brand-accent underline"
                  >
                    {t('email_fix_button')}
                  </button>
                </p>
              )}
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
                autoComplete="off"
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
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
                autoComplete="off"
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
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
                autoComplete="new-password"
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
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
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-[13px] text-[#4A4540]">
                <input
                  type="checkbox"
                  required
                  checked={consentTerms}
                  onChange={e => setConsentTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#412618]"
                />
                <span>
                  {t.rich('consent_terms_text', {
                    terms: chunks => (
                      <Link href={`/${locale}/terms`} className="underline">{chunks}</Link>
                    ),
                    privacy: chunks => (
                      <Link href={`/${locale}/privacy`} className="underline">{chunks}</Link>
                    ),
                  })}
                </span>
              </label>

              <label className="flex items-start gap-2 text-[13px] text-[#4A4540]">
                <input
                  type="checkbox"
                  checked={consentEmailMarketing}
                  onChange={e => setConsentEmailMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#412618]"
                />
                <span>{t('consent_email_marketing')}</span>
              </label>

              <label className="flex items-start gap-2 text-[13px] text-[#4A4540]">
                <input
                  type="checkbox"
                  checked={consentSmsMarketing}
                  onChange={e => setConsentSmsMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#412618]"
                />
                <span>{t('consent_sms_marketing')}</span>
              </label>
            </div>

            <button type="submit" disabled={loading || !consentTerms || !!emailError} className="btn btn-primary w-full">
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
