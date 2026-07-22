'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'

interface Address {
  id: string
  street: string | null
  postal_code: string | null
  city: string | null
}

interface Props {
  initialName: string
  email: string
  phone: string
  registeredDate: string
  consentEmail: boolean
  consentSms: boolean
  initialAddress: Address | null
}

export default function ProfileCard({
  initialName,
  email,
  phone,
  registeredDate,
  consentEmail,
  consentSms,
  initialAddress,
}: Props) {
  const t = useTranslations('dashboard')

  // Name inline edit
  const [name, setName] = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(initialName)
  const [savingName, setSavingName] = useState(false)

  // Address
  const [address, setAddress] = useState<Address | null>(initialAddress)
  const [editingAddress, setEditingAddress] = useState(false)
  const [addrDraft, setAddrDraft] = useState({
    street: initialAddress?.street ?? '',
    postal_code: initialAddress?.postal_code ?? '',
    city: initialAddress?.city ?? '',
  })
  const [savingAddress, setSavingAddress] = useState(false)

  async function saveName() {
    setSavingName(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameDraft }),
      })
      if (!res.ok) throw new Error()
      setName(nameDraft)
      setEditingName(false)
      // Tell the header (and any other listener) to re-read shop_users.name so
      // it doesn't keep showing the pre-edit value.
      window.dispatchEvent(new Event('shop-user-updated'))
      toast.success(t('saved'))
    } catch {
      toast.error(t('save_error'))
    } finally {
      setSavingName(false)
    }
  }

  function openAddressForm() {
    setAddrDraft({
      street: address?.street ?? '',
      postal_code: address?.postal_code ?? '',
      city: address?.city ?? '',
    })
    setEditingAddress(true)
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddress(true)
    try {
      const method = address ? 'PATCH' : 'POST'
      const res = await fetch('/api/account/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(address ? { id: address.id } : {}),
          type: 'courier',
          street: addrDraft.street,
          postal_code: addrDraft.postal_code,
          city: addrDraft.city,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error()
      setAddress({
        id: address?.id ?? data.id,
        street: addrDraft.street,
        postal_code: addrDraft.postal_code,
        city: addrDraft.city,
      })
      setEditingAddress(false)
      toast.success(t('saved'))
    } catch {
      toast.error(t('save_error'))
    } finally {
      setSavingAddress(false)
    }
  }

  const primaryBtn = 'rounded-full px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60'
  const ghostBtn = 'rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-[#3A2115]'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-[18px] font-bold uppercase text-[#3A2115]">{t('profile_title')}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name — inline editable */}
        <div>
          <p className="text-xs text-brand-muted">{t('name_label')}</p>
          {editingName ? (
            <div className="mt-1 space-y-2">
              <input
                type="text"
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                className="input w-full"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className={primaryBtn}
                  style={{ backgroundColor: '#412618' }}
                >
                  {savingName ? '…' : t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setNameDraft(name) }}
                  className={ghostBtn}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-medium">{name || t('not_provided')}</p>
              <button
                type="button"
                aria-label={t('edit')}
                onClick={() => { setNameDraft(name); setEditingName(true) }}
                className="text-brand-muted transition-colors hover:text-[#412618]"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Email — read only */}
        <div>
          <p className="text-xs text-brand-muted">{t('email_label')}</p>
          <p className="font-medium">{email}</p>
        </div>

        {/* Phone — read only */}
        <div>
          <p className="text-xs text-brand-muted">{t('phone_label')}</p>
          <p className="font-medium">{phone || t('not_provided')}</p>
        </div>

        {/* Registered — read only */}
        <div>
          <p className="text-xs text-brand-muted">{t('registered_label')}</p>
          <p className="font-medium">{registeredDate}</p>
        </div>

        {/* Consents — read only */}
        <div className="sm:col-span-2">
          <p className="text-xs text-brand-muted">{t('consents_label')}</p>
          <p className="font-medium">
            {t('consent_email_label')}: {consentEmail ? t('consent_yes') : t('consent_no')}
            {' · '}
            {t('consent_sms_label')}: {consentSms ? t('consent_yes') : t('consent_no')}
          </p>
        </div>
      </div>

      {/* Address block */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-[#3A2115]">{t('address_title')}</p>
          {!editingAddress && address && (
            <button
              type="button"
              onClick={openAddressForm}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#412618] hover:underline"
            >
              <Pencil size={13} /> {t('edit')}
            </button>
          )}
        </div>

        {editingAddress ? (
          <form onSubmit={saveAddress} className="space-y-3">
            <label className="block text-sm">
              <span className="text-brand-muted">{t('street_label')}</span>
              <input
                type="text"
                required
                value={addrDraft.street}
                onChange={e => setAddrDraft(d => ({ ...d, street: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-brand-muted">{t('postal_label')}</span>
                <input
                  type="text"
                  required
                  placeholder="XX-XXX"
                  value={addrDraft.postal_code}
                  onChange={e => setAddrDraft(d => ({ ...d, postal_code: e.target.value }))}
                  className="input mt-1 w-full"
                />
              </label>
              <label className="block text-sm">
                <span className="text-brand-muted">{t('city_label')}</span>
                <input
                  type="text"
                  required
                  value={addrDraft.city}
                  onChange={e => setAddrDraft(d => ({ ...d, city: e.target.value }))}
                  className="input mt-1 w-full"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingAddress}
                className={primaryBtn}
                style={{ backgroundColor: '#412618' }}
              >
                {savingAddress ? '…' : t('save_address')}
              </button>
              <button
                type="button"
                onClick={() => setEditingAddress(false)}
                className={ghostBtn}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        ) : address ? (
          <p className="font-medium">
            {address.street}, {address.postal_code} {address.city}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-brand-muted">{t('no_address')}</p>
            <button
              type="button"
              onClick={openAddressForm}
              className="rounded-full border border-[#412618] px-4 py-1.5 text-sm font-semibold text-[#412618]"
            >
              {t('add_address')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
