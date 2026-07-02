'use client'

interface Props {
  rating:  number  // 0–5, supports decimals
  size?:   'sm' | 'md' | 'lg'
  showNum?: boolean
}

const SIZES = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }

export default function StarDisplay({ rating, size = 'md', showNum }: Props) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${SIZES[size]}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
      {showNum && (
        <span className="ml-1 text-brand-muted text-xs font-medium">{rating.toFixed(1)}</span>
      )}
    </span>
  )
}
