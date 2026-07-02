'use client'
import { getLoyaltyColor, getLoyaltyLabel, getLoyaltyDiscount, getNextLevel } from '@/lib/supabase/auth'
import type { SessionUser } from '@/lib/supabase/auth'

interface Props {
  user:   SessionUser
  config: Record<string, number>
}

export default function LoyaltyCard({ user, config }: Props) {
  const level    = user.loyalty_level
  const gradient = getLoyaltyColor(level)
  const label    = getLoyaltyLabel(level)
  const discount = getLoyaltyDiscount(level, config)
  const next     = getNextLevel(level, user.spent_12m, config)

  const progress = next
    ? Math.min(100, Math.round((user.spent_12m / next.threshold) * 100))
    : 100

  return (
    <div className="space-y-4">
      {/* Visual card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl`}
        style={{ minHeight: 160 }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-6 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75 mb-1">Coffee Verve</p>
          <p className="text-2xl font-bold tracking-tight">{label}</p>
          <p className="text-sm opacity-75 mt-0.5">Скидка {discount}% на все заказы</p>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-end justify-between">
            <div>
              <p className="text-xs opacity-60">Клиент</p>
              <p className="font-semibold">{user.name || user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">Потрачено за год</p>
              <p className="font-bold">{user.spent_12m.toFixed(0)} zł</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to next level */}
      {next && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">До уровня <span className="font-bold">{next.name}</span></p>
            <p className="text-sm text-brand-muted">{next.remaining.toFixed(0)} zł</p>
          </div>
          <div className="h-2 rounded-full bg-brand-border overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-gold transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-1.5">
            {user.spent_12m.toFixed(0)} / {next.threshold} zł за последние 12 месяцев
          </p>
        </div>
      )}
      {!next && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-center">
          <p className="text-sm font-semibold">🏆 Вы на максимальном уровне Platinum!</p>
          <p className="text-xs text-brand-muted mt-1">Скидка {discount}% действует постоянно</p>
        </div>
      )}
    </div>
  )
}
