import { redirect } from 'next/navigation'

// Short referral link: /{locale}/ref/{CODE} → shop with ?ref so RefCapture stores it.
export default function RefRedirect({ params }: { params: { locale: string; code: string } }) {
  redirect(`/${params.locale}/shop?ref=${encodeURIComponent(params.code)}`)
}
