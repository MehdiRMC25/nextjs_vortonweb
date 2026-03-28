import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Membership & reward points policy',
  description:
    'Vorton membership tiers, reward points earning and redemption, and programme terms. Prices and points in ₼ where applicable.',
  alternates: {
    canonical: '/reward-points',
  },
  openGraph: {
    title: 'Membership & reward points policy | Vorton',
    description: 'How Vorton reward points and membership benefits work.',
    url: '/reward-points',
  },
}

export default function RewardPointsLayout({ children }: { children: React.ReactNode }) {
  return children
}
