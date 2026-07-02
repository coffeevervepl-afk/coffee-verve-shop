'use client'
import { useState } from 'react'
import ReviewForm from './ReviewForm'

interface Props {
  productId: string
  orderId:   string | null
  email:     string
}

export default function ReviewFormWrapper({ productId, orderId, email }: Props) {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold">Отзыв отправлен!</p>
        <p className="text-sm text-brand-muted mt-1">Он появится на сайте после проверки.</p>
      </div>
    )
  }

  return (
    <ReviewForm
      productId={productId}
      orderId={orderId}
      email={email}
      onSuccess={() => setSubmitted(true)}
    />
  )
}
