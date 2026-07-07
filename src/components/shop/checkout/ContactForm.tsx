'use client'
import { useTranslations } from 'next-intl'
import { isTelegramUsernameValid, normalizeTelegramUsername } from '@/lib/telegram'

interface Props {
  values:   Record<string, any>
  onChange: (v: Record<string, string>) => void
  onEmailBlur?: (email: string) => void
}

export default function ContactForm({ values, onChange, onEmailBlur }: Props) {
  const t = useTranslations('checkout')
  const telegramValue = String(values.telegram ?? '')
  const normalizedTelegram = normalizeTelegramUsername(telegramValue)
  const showTelegramHint = telegramValue.trim() !== '' && !isTelegramUsernameValid(normalizedTelegram ?? undefined)

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
          onBlur={e => onEmailBlur?.(e.target.value)}
          className="input"
        />
        <input
          type="tel"
          placeholder={t('phone')}
          value={values.phone ?? ''}
          onChange={e => onChange({ phone: e.target.value })}
          className="input"
        />
        <div>
          <input
            type="text"
            placeholder={t('telegram_placeholder')}
            value={telegramValue}
            onChange={e => onChange({ telegram: e.target.value })}
            className="input"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <p className="mt-1 text-xs text-brand-muted">{t('telegram_help')}</p>
          {showTelegramHint && (
            <p className="mt-1 text-xs text-amber-600">{t('telegram_invalid')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
