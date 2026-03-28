import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Vorton — store address in Baku, phone, email, and Instagram. We are here to help with orders and questions.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact | Vorton',
    description: 'Get in touch with Vorton — location, phone, email, and social links.',
    url: '/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
