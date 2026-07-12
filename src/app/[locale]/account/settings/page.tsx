import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import SettingsForm from '@/components/account/SettingsForm'
import type { Locale } from '@/types/shop'

interface Props {
  params: { locale: Locale }
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect(`/${locale}/account/login`)
  }

  const email = user.email

  const { data: shopUser } = await supabase
    .from('shop_users')
    .select('id, name, phone, consent_email_marketing, consent_sms_marketing')
    .eq('email', email)
    .single()

  const { data: addresses } = shopUser
    ? await supabase
        .from('shop_addresses')
        .select('id, label, recipient_name, street, city, postal_code, recipient_phone')
        .eq('shop_user_id', shopUser.id)
        .order('created_at', { ascending: true })
        .limit(3)
    : { data: [] }

  return (
    <SettingsForm
      initialProfile={{
        name:                     shopUser?.name ?? '',
        phone:                    shopUser?.phone ?? '',
        consent_email_marketing:  shopUser?.consent_email_marketing ?? false,
        consent_sms_marketing:    shopUser?.consent_sms_marketing ?? false,
      }}
      initialAddresses={addresses ?? []}
    />
  )
}
