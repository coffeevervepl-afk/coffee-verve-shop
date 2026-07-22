import type { Metadata } from 'next'
import Link from 'next/link'
import { REFERRAL_CONTENT } from '@/lib/referral-content'
import { createServerSupabase } from '@/lib/supabase/server'
import ReferralShareButtons from '@/components/shop/ReferralShareButtons'
import type { Locale } from '@/types/shop'

const BASE = 'https://coffeeverve.pl'

interface Props { params: { locale: Locale } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = REFERRAL_CONTENT[params.locale] ?? REFERRAL_CONTENT.ru
  return {
    title:       c.metaTitle,
    description: c.metaDescription,
    robots:      { index: true, follow: true },
    alternates: {
      canonical: `${BASE}/${params.locale}/referral`,
      languages: {
        pl: `${BASE}/pl/referral`,
        ru: `${BASE}/ru/referral`,
        uk: `${BASE}/ua/referral`,
      },
    },
  }
}

export default async function ReferralPage({ params }: Props) {
  const { locale } = params
  const c = REFERRAL_CONTENT[locale] ?? REFERRAL_CONTENT.ru

  let code: string | null = null
  try {
    const sb = await createServerSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (user?.email) {
      const { data } = await sb.from('shop_users').select('referral_code').eq('email', user.email).maybeSingle()
      code = data?.referral_code ?? null
    }
  } catch { /* anonymous visitor */ }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="container py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="rounded-3xl bg-[#412618] px-6 py-10 text-center text-white md:px-10 md:py-14">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">{c.heroTitle}</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/80">{c.heroSubtitle}</p>

        <div className="mx-auto mt-8 max-w-md">
          {code ? (
            <>
              <p className="mb-3 text-sm font-semibold text-white/80">{c.loggedTitle}</p>
              <ReferralShareButtons locale={locale} code={code} />
            </>
          ) : (
            <Link href={`/${locale}/account/login`} className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#412618] transition hover:bg-white/90">
              {c.ctaLogin}
            </Link>
          )}
        </div>
      </section>

      {/* 3 steps */}
      <section className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3">
        {c.steps.map((s, i) => (
          <div key={i} className="rounded-2xl border border-brand-border bg-brand-surface p-6 text-center">
            <div className="text-4xl">{s.icon}</div>
            <h2 className="mt-3 text-lg font-semibold text-[#3A2115]">{s.title}</h2>
            <p className="mt-2 text-sm text-brand-muted">{s.text}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-12 max-w-2xl md:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-[#3A2115]">{c.faqTitle}</h2>
        <div className="space-y-3">
          {c.faq.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-brand-border bg-brand-surface p-4">
              <summary className="cursor-pointer list-none font-medium text-[#3A2115] marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span aria-hidden className="text-brand-muted transition group-open:rotate-45">＋</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-brand-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
