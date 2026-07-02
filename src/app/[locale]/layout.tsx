import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import Navbar from '@/components/layout/Navbar'
import CartDrawer from '@/components/shop/CartDrawer'
import RefCapture from '@/components/shop/RefCapture'
import { Suspense } from 'react'
import { Toaster } from 'react-hot-toast'

const locales = ['ru', 'pl', 'ua'] as const

export const metadata: Metadata = {
  title:       { default: 'Coffee Verve — Specialty Coffee Warsaw', template: '%s | Coffee Verve' },
  description: 'Свежеобжаренный specialty кофе с доставкой по всей Польше.',
  openGraph:   { siteName: 'Coffee Verve', locale: 'ru_RU' },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params
  if (!locales.includes(locale as any)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Navbar locale={locale as any} />
          <Suspense fallback={null}><RefCapture /></Suspense>
          <main>{children}</main>
          <CartDrawer />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { background: 'var(--color-accent)', color: '#fff', borderRadius: '12px' },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
