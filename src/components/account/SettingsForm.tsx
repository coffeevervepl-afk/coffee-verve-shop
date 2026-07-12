'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import type { Locale } from '@/types/shop'

interface Profile {
  name: string
  phone: string
  consent_email_marketing: boolean
  consent_sms_marketing: boolean
}

interface Address {
  id: string
  label: string | null
  recipient_name: string | null
  street: string | null
  city: string | null
  postal_code: string | null
  recipient_phone: string | null
}

interface Props {
  locale: Locale
  initialProfile: Profile
  initialAddresses: Address[]
}

const emptyAddressForm = {
  label: '',
  recipient_name: '',
  street: '',
  city: '',
  postal_code: '',
  recipient_phone: '',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? '#412618' : '#D8D2CB' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

export default function SettingsForm({ locale, initialProfile, initialAddresses }: Props) {
  const t = useTranslations('settings')

  const [profile, setProfile] = useState(initialProfile)
  const [savingProfile, setSavingProfile] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState(emptyAddressForm)
  const [savingAddress, setSavingAddress] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      if (!res.ok) throw new Error()
      toast.success(t('saved_toast'))
    } catch {
      toast.error(t('save_error'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function toggleConsent(field: 'consent_email_marketing' | 'consent_sms_marketing', value: boolean) {
    const prev = profile[field]
    setProfile(p => ({ ...p, [field]: value }))
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
      toast.success(t('saved_toast'))
    } catch {
      setProfile(p => ({ ...p, [field]: prev }))
      toast.error(t('save_error'))
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddress(true)
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'courier', ...addressForm }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error === 'max_addresses_reached' ? t('max_addresses_reached') : t('address_error'))
        return
      }
      setAddresses(prev => [...prev, { id: crypto.randomUUID(), ...addressForm }])
      setAddressForm(emptyAddressForm)
      setAddingAddress(false)
      toast.success(t('address_saved'))
    } catch {
      toast.error(t('address_error'))
    } finally {
      setSavingAddress(false)
    }
  }

  async function deleteAddress(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success(t('address_deleted'))
    } catch {
      toast.error(t('address_error'))
    } finally {
      setDeletingId(null)
    }
  }

  const cardClass = 'rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
  const titleClass = 'mb-4 text-[18px] font-bold uppercase text-[#3A2115]'
  const inputClass = 'input mt-2 w-full'

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold uppercase text-[#3A2115]">{t('page_title')}</h1>
        <Link
          href={`/${locale}/account`}
          className="mt-1 inline-flex items-center gap-1 text-xs text-brand-muted transition-colors hover:text-[#3A2115]"
        >
          ← {t('back_to_account')}
        </Link>
      </div>

      {/* Block 1 — Personal data */}
      <section className={cardClass}>
        <h2 className={titleClass}>{t('personal_data_title')}</h2>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-brand-muted">{t('name_label')}</span>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-brand-muted">{t('phone_label')}</span>
            <input
              type="tel"
              placeholder="+48XXXXXXXXX"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            disabled={savingProfile}
            onClick={saveProfile}
            className="rounded-full px-6 py-2.5 font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#412618' }}
          >
            {savingProfile ? '…' : t('save_button')}
          </button>
        </div>
      </section>

      {/* Block 2 — Delivery addresses */}
      <section className={cardClass}>
        <h2 className={titleClass}>{t('addresses_title')}</h2>

        {addresses.length === 0 && !addingAddress && (
          <p className="text-sm text-brand-muted">{t('no_addresses')}</p>
        )}

        {addresses.length > 0 && (
          <div className="mb-4 divide-y divide-brand-border">
            {addresses.map(addr => (
              <div key={addr.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-[#3A2115]">{addr.label || t('addresses_title')}</p>
                  <p className="mt-0.5 text-sm text-brand-muted">
                    {addr.recipient_name ? `${addr.recipient_name} · ` : ''}
                    {addr.street}, {addr.city} {addr.postal_code}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={deletingId === addr.id}
                  onClick={() => deleteAddress(addr.id)}
                  className="shrink-0 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  {deletingId === addr.id ? '…' : t('delete_button')}
                </button>
              </div>
            ))}
          </div>
        )}

        {addresses.length >= 3 ? (
          <p className="text-sm text-brand-muted">{t('max_addresses_reached')}</p>
        ) : addingAddress ? (
          <form onSubmit={addAddress} className="space-y-3 border-t border-brand-border pt-4">
            <label className="block text-sm">
              <span className="text-brand-muted">{t('address_label_label')}</span>
              <input
                type="text"
                required
                value={addressForm.label}
                onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('recipient_name_label')}</span>
              <input
                type="text"
                required
                value={addressForm.recipient_name}
                onChange={e => setAddressForm(f => ({ ...f, recipient_name: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('street_label')}</span>
              <input
                type="text"
                required
                value={addressForm.street}
                onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-brand-muted">{t('city_label')}</span>
                <input
                  type="text"
                  required
                  value={addressForm.city}
                  onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="text-brand-muted">{t('postal_label')}</span>
                <input
                  type="text"
                  required
                  placeholder="XX-XXX"
                  pattern="\d{2}-\d{3}"
                  value={addressForm.postal_code}
                  onChange={e => setAddressForm(f => ({ ...f, postal_code: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('recipient_phone_label')}</span>
              <input
                type="tel"
                required
                placeholder="+48XXXXXXXXX"
                value={addressForm.recipient_phone}
                onChange={e => setAddressForm(f => ({ ...f, recipient_phone: e.target.value }))}
                className={inputClass}
              />
            </label>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={savingAddress}
                className="rounded-full px-6 py-2.5 font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#412618' }}
              >
                {savingAddress ? '…' : t('save_button')}
              </button>
              <button
                type="button"
                onClick={() => { setAddingAddress(false); setAddressForm(emptyAddressForm) }}
                className="rounded-full border border-brand-border px-6 py-2.5 font-semibold text-[#3A2115]"
              >
                {t('cancel_button')}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingAddress(true)}
            className="rounded-full border border-[#412618] px-6 py-2.5 font-semibold text-[#412618]"
          >
            {t('add_address_button')}
          </button>
        )}
      </section>

      {/* Block 3 — Marketing consents (RODO) */}
      <section className={cardClass}>
        <h2 className={titleClass}>{t('consents_title')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#3A2115]">{t('consent_email_toggle')}</span>
            <Toggle
              checked={profile.consent_email_marketing}
              onChange={v => toggleConsent('consent_email_marketing', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#3A2115]">{t('consent_sms_toggle')}</span>
            <Toggle
              checked={profile.consent_sms_marketing}
              onChange={v => toggleConsent('consent_sms_marketing', v)}
            />
          </div>
          <p className="text-xs text-brand-muted">{t('consent_note')}</p>
        </div>
      </section>
    </div>
  )
}
