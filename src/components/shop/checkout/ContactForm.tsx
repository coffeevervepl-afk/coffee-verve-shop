'use client'
import { useTranslations } from 'next-intl'

interface Props {
  values:   Record<string, any>
  onChange: (v: Record<string, string>) => void
}

export default function ContactForm({ values, onChange }: Props) {
  const t = useTranslations('checkout')

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t('contact')}</h2>
      <div className="space-y-3">
        <input
          required
          type="text"
          placeholder={t('name')}
          value={values.name ?? ''}
          onChange={e => onChange({ name: e.target.value })}
          className="input"
        />
        <input
          required
          type="email"
          placeholder={t('email')}
          value={values.email ?? ''}
          onChange={e => onChange({ email: e.target.value })}
          className="input"
        />
        <input
          type="tel"
          placeholder={t('phone')}
          value={values.phone ?? ''}
          onChange={e => onChange({ phone: e.target.value })}
          className="input"
        />
      </div>
    </section>
  )
}
