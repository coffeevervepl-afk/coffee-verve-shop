'use client'
import { useState } from 'react'

interface Props {
  value:    number
  onChange: (v: number) => void
}

export default function StarPicker({ value, onChange }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex gap-1" role="group" aria-label="Рейтинг">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-colors ${
            i <= active ? 'text-amber-400' : 'text-gray-200'
          } hover:text-amber-400`}
          aria-label={`${i} звезд`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
