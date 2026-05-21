import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { translations } from '@/locales/translations'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await headers()).get('x-next-locale') === 'az' ? 'az' : 'en'
  const t = translations[locale]
  const title = locale === 'az' ? t.shop : 'Shop'
  const description =
      locale === 'az'
          ? 'Kişilər və qadınlar üçün premium gündəlik geyimlər. Yeni kolleksiyaları, seçilmiş modelləri kəşf edin və rahatlıqla qapınıza çatdırılan dəbli geyimlərdən yararlanın.'
          : 'Browse Vorton’s shop — men’s and women’s clothing, new arrivals, and seasonal edits. Prices in ₼. Secure checkout.'
  const ogDescription =
      locale === 'az'
          ? description
          : 'Explore men’s and women’s fashion at Vorton — new collections and sale items.'

  return {
    title,
    description,
    alternates: {
      canonical: '/shop',
    },
    openGraph: {
      title: `${title} | Vorton`,
      description: ogDescription,
      url: '/shop',
    },
  }
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
