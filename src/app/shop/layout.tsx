import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse Vorton’s shop — men’s and women’s clothing, new arrivals, and seasonal edits. Prices in ₼. Secure checkout.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop | Vorton',
    description: 'Explore men’s and women’s fashion at Vorton — new collections and sale items.',
    url: '/shop',
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
