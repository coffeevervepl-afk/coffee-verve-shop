import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale }
}

const TITLE: Record<Locale, string> = {
  ru: 'Мой кабинет',
  pl: 'Moje konto',
  ua: 'Мій кабінет',
}

const ORDERS_PLACEHOLDER: Record<Locale, string> = {
  ru: 'Заказы появятся здесь',
  pl: 'Zamówienia pojawią się tutaj',
  ua: "Замовлення з'являться тут",
}

export default async function AccountPage({ params }: Props) {
  const { locale } = params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/account/login`)
  }

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">{TITLE[locale]}</h1>
      <p className="text-brand-muted mb-8">{user.email}</p>
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center text-brand-muted">
        {ORDERS_PLACEHOLDER[locale]}
      </div>
    </div>
  )
}
