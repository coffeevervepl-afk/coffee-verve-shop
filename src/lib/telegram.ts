const TELEGRAM_PATTERN = /^[a-zA-Z0-9_]{5,32}$/

export function normalizeTelegramUsername(input: string | null | undefined): string | null {
  if (!input) return null

  const trimmed = input.trim()
  if (!trimmed) return null

  const withoutAt = trimmed.replace(/^@+/, '')
  const withoutSpaces = withoutAt.replace(/\s+/g, '')

  const normalized = withoutSpaces
    .replace(/^https?:\/\//i, '')
    .replace(/^telegram\.me\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@+/, '')
    .replace(/\/+$/, '')

  const username = normalized.split('/').filter(Boolean).pop() ?? ''
  const cleaned = username.replace(/^@+/, '').trim()

  return TELEGRAM_PATTERN.test(cleaned) ? cleaned : null
}

export function isTelegramUsernameValid(input: string | null | undefined): boolean {
  return Boolean(input && TELEGRAM_PATTERN.test(input))
}
