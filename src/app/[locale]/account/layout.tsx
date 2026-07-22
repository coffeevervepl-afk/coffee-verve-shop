import type { Metadata } from 'next'

// Personal cabinet — keep out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="container py-10">{children}</div>
}
