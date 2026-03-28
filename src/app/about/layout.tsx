import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Vorton',
  description:
    'Learn about Vorton — contemporary fashion, design philosophy, and our team. Based in Azerbaijan with a global outlook.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Vorton | Vorton',
    description:
      'Discover the story behind Vorton — inspiration, craft, and how we design for real life.',
    url: '/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
