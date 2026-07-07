'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

interface Address {
  id: string
  type: string
  street: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  paczkomat_name: string | null
  paczkomat_address: string | null
  is_default: boolean
}

const emptyAddress = {
  type: 'courier', street: '', city: '', postal_code: '', country: 'PL', paczkomat_name: '', paczkomat_address: '', is_default: false,
}

export default function AddressesPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('account')
  const { user, loading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState<any>(emptyAddress)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoadingAddresses(true)
    fetch('/api/account/addresses')
      .then(res => res.json())
      .then(data => setAddresses(data.addresses ?? []))
      .finally(() => setLoadingAddresses(false))
  }, [user])

  async function addAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setForm(emptyAddress)
      setAddresses(prev => [...prev, { ...form, id: crypto.randomUUID() }])
      toast.success(t('address_saved'))
    } catch (err: any) {
      toast.error(err?.message || t('address_save_error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-brand-muted">{t('loading')}</div>
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
        <h1 className="text-2xl font-semibold mb-2">{t('addresses_title')}</h1>
        <p className="text-sm text-brand-muted">{t('addresses_subtitle')}</p>
      </div>

      <div className="rounded-3xl border border-brand-border bg-brand-surface overflow-hidden">
        {loadingAddresses ? (
          <div className="p-8 text-center text-brand-muted">{t('loading')}</div>
        ) : addresses.length === 0 ? (
          <div className="p-8 text-center text-brand-muted">{t('addresses_empty')}</div>
        ) : (
          <div className="divide-y divide-brand-border">
            {addresses.map(addr => (
              <div key={addr.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{addr.type === 'paczkomat' ? 'Paczkomat' : 'Доставка'}</p>
                    <p className="text-sm text-brand-muted mt-1">
                      {addr.type === 'paczkomat'
                        ? `${addr.paczkomat_name}, ${addr.paczkomat_address}`
                        : `${addr.street}, ${addr.city} ${addr.postal_code}`}
                    </p>
                  </div>
                  {addr.is_default && <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">По умолчанию</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="rounded-3xl border border-brand-border bg-brand-surface p-6 space-y-4" onSubmit={addAddress}>
        <h2 className="text-lg font-semibold">{t('add_address')}</h2>
        <label className="block text-sm">
          <span className="text-brand-muted">{t('address_type')}</span>
          <select
            className="input mt-2 w-full"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="courier">Курьер</option>
            <option value="paczkomat">Paczkomat</option>
          </select>
        </label>
        {form.type === 'courier' ? (
          <>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('street')}</span>
              <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="input mt-2 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('city')}</span>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input mt-2 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('postal')}</span>
              <input type="text" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="input mt-2 w-full" />
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('paczkomat_name')}</span>
              <input type="text" value={form.paczkomat_name} onChange={e => setForm({ ...form, paczkomat_name: e.target.value })} className="input mt-2 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-brand-muted">{t('paczkomat_address')}</span>
              <input type="text" value={form.paczkomat_address} onChange={e => setForm({ ...form, paczkomat_address: e.target.value })} className="input mt-2 w-full" />
            </label>
          </>
        )}
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={e => setForm({ ...form, is_default: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-gold)] rounded"
          />
          {t('set_default')}
        </label>
        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? '…' : t('save')}
        </button>
      </form>
    </div>
  )
}
