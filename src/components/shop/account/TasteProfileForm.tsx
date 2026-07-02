'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface TasteProfile {
  brew_method:  string
  flavor_pref:  string
  acidity:      string
  strength:     string
}

interface Props {
  initial:  TasteProfile | null
  email:    string
  onSave:   (p: TasteProfile) => void
  compact?: boolean
}

const QUESTIONS = [
  {
    key: 'brew_method', label: 'Как вы готовите кофе?',
    options: [
      { value: 'espresso',  emoji: '☕',  label: 'Эспрессо / Капучино' },
      { value: 'filter',    emoji: '☕',  label: 'Фильтр / Пуровер' },
      { value: 'turka',     emoji: '🫖',  label: 'Турка' },
      { value: 'capsules',  emoji: '💊',  label: 'Капсулы' },
    ],
  },
  {
    key: 'flavor_pref', label: 'Какой вкус предпочитаете?',
    options: [
      { value: 'choc_nuts', emoji: '🍫', label: 'Шоколад и орехи' },
      { value: 'berries',   emoji: '🍒', label: 'Ягоды и цветы' },
      { value: 'balanced',  emoji: '⚖️', label: 'Сбалансированный' },
      { value: 'caramel',   emoji: '🍮', label: 'Карамель и сладость' },
    ],
  },
  {
    key: 'acidity', label: 'Как относитесь к кислотности?',
    options: [
      { value: 'love',    emoji: '😍', label: 'Люблю яркую кислинку' },
      { value: 'mild',    emoji: '🙂', label: 'Лёгкая — нормально' },
      { value: 'dislike', emoji: '😑', label: 'Не люблю кислоту' },
      { value: 'any',     emoji: '🤷', label: 'Всё равно' },
    ],
  },
  {
    key: 'strength', label: 'Крепость кофе?',
    options: [
      { value: 'mild',   emoji: '🌿', label: 'Мягкий, нежный' },
      { value: 'medium', emoji: '☕', label: 'Средний' },
      { value: 'strong', emoji: '💪', label: 'Крепкий' },
      { value: 'any',    emoji: '🤷', label: 'Без разницы' },
    ],
  },
]

export default function TasteProfileForm({ initial, email, onSave, compact }: Props) {
  const [profile, setProfile] = useState<TasteProfile>(
    initial ?? { brew_method: '', flavor_pref: '', acidity: '', strength: '' }
  )
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(!!initial && Object.values(initial).every(Boolean))

  const q = QUESTIONS[step]

  function pick(value: string) {
    const next = { ...profile, [q.key]: value }
    setProfile(next)
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      save(next)
    }
  }

  async function save(p: TasteProfile) {
    setSaving(true)
    try {
      await fetch('/api/account', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, taste_profile: p }),
      })
      toast.success('Профиль сохранён!')
      setDone(true)
      onSave(p)
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (done && !compact) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Вкусовой профиль</h3>
          <button onClick={() => setDone(false)} className="text-xs text-brand-muted underline">
            Изменить
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUESTIONS.map(q => {
            const val = (profile as any)[q.key]
            const opt = q.options.find(o => o.value === val)
            return opt ? (
              <div key={q.key} className="rounded-xl bg-brand-border/20 px-3 py-2">
                <p className="text-xs text-brand-muted">{q.label}</p>
                <p className="text-sm font-medium">{opt.emoji} {opt.label}</p>
              </div>
            ) : null
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold">{q.label}</p>
          <p className="text-xs text-brand-muted ml-auto">{step + 1} / {QUESTIONS.length}</p>
        </div>
        <div className="h-1 rounded-full bg-brand-border overflow-hidden">
          <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${((step) / QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {q.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => pick(opt.value)}
            disabled={saving}
            className={`rounded-xl border-2 p-3 text-left transition hover:border-brand-accent ${
              (profile as any)[q.key] === opt.value
                ? 'border-brand-accent bg-brand-accent/5'
                : 'border-brand-border'
            }`}
          >
            <p className="text-xl mb-1">{opt.emoji}</p>
            <p className="text-xs font-medium leading-tight">{opt.label}</p>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)} className="mt-3 text-xs text-brand-muted underline">
          ← Назад
        </button>
      )}
    </div>
  )
}
