import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { translations } from '@/locales/translations'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await headers()).get('x-next-locale') === 'az' ? 'az' : 'en'
  const t = translations[locale]
  const title = t.aboutVorton
  const description = t.aboutIntro1
  const ogDescription =
      locale === 'az'
          ? description
          : 'Discover the story behind Vorton — inspiration, craft, and how we design for real life.'

  return {
    title,
    description,
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: `${title} | Vorton`,
      description: ogDescription,
      url: '/about',
    },
  }
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
