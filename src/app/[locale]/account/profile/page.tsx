'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

const languages = [
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
  { value: 'ua', label: 'Українська' },
]

export default function ProfilePage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('account')
  const { user, loading, refresh } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [telegram, setTelegram] = useState('')
  const [birthday, setBirthday] = useState('')
  const [language, setLanguage] = useState(locale)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setPhone(user.phone ?? '')
    setTelegram(user.telegram ?? '')
    setBirthday(user.birthday ?? '')
    setLanguage(user.language ?? locale)
  }, [user, locale])

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name,
          phone,
          telegram,
          birthday,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(t('profile_saved'))
      await refresh()
    } catch (err: any) {
      toast.error(err?.message || t('profile_save_error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-brand-muted">{t('loading')}</div>
  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{t('profile_title')}</h1>
      <p className="text-sm text-brand-muted mb-6">{t('profile_subtitle')}</p>
      <form className="space-y-4" onSubmit={handleSave}>
        <div className="rounded-2xl border border-brand-border bg-white/5 p-4">
          <p className="text-sm text-brand-muted mb-2">{t('email')}</p>
          <p className="text-base font-medium">{user.email}</p>
        </div>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('name')}</span>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="input mt-2 w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('phone')}</span>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="input mt-2 w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('telegram')}</span>
          <input
            type="text"
            value={telegram}
            onChange={e => setTelegram(e.target.value)}
            placeholder="@username"
            className="input mt-2 w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('birthday')}</span>
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            className="input mt-2 w-full"
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
        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? '…' : t('save')}
        </button>
      </form>
    </div>
  )
}
