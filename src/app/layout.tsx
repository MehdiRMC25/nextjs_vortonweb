import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { ProductsProvider } from '@/context/ProductsContext'
import { CartProvider } from '@/context/CartContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import Layout from '@/components/Layout'
import { getCanonicalAndAlternates, getRequestOrigin } from '@/lib/siteUrl'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-outfit' })

export async function generateMetadata(): Promise<Metadata> {
    const h = await headers()
    const { canonical, alternates } = getCanonicalAndAlternates(h)
    const locale = h.get('x-next-locale') === 'az' ? 'az' : 'en'
    const ogLocale = locale === 'az' ? 'az_AZ' : 'en_GB'
    const site = getRequestOrigin(h)
    const metadataBase = new URL(site.endsWith('/') ? site : `${site}/`)

    const titleDefault =
        locale === 'az' ? 'Üslubun Rahatlıqla Qovuşduğu Yer' : 'Vorton Fashion — Discover Your Style'
    const description =
        locale === 'az'
            ? 'Kişilər və qadınlar üçün premium gündəlik geyimlər. Yeni kolleksiyaları, seçilmiş modelləri kəşf edin və rahatlıqla qapınıza çatdırılan dəbli geyimlərdən yararlanın.'
            : 'Vorton — contemporary fashion and everyday clothing. Shop men’s and women’s collections with secure checkout and delivery.'
    const ogDescription =
        locale === 'az'
            ? description
            : 'Contemporary fashion for modern life. Explore men’s and women’s clothing, new arrivals, and seasonal edits.'
    const twitterDescription =
        locale === 'az'
            ? description
            : 'Contemporary fashion for modern life. Shop men’s and women’s clothing at Vorton.'

    return {
        metadataBase,
        title: {
            default: titleDefault,
            template: '%s | Vorton',
        },
        description,
        applicationName: 'Vorton',
        alternates: {
            canonical,
            languages: {
                'az-AZ': alternates.az,
                'en-GB': alternates.en,
                'x-default': alternates.en,
            },
        },
        openGraph: {
            type: 'website',
            locale: ogLocale,
            url: canonical,
            siteName: 'Vorton',
            title: titleDefault,
            description: ogDescription,
            images: [{ url: '/Vorton_Logo.png', width: 512, height: 512, alt: 'Vorton' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: titleDefault,
            description: twitterDescription,
        },
        robots: {
            index: true,
            follow: true,
        },
        icons: {
            icon: '/vorton_web_favicon.png',
        },
    }
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const headersList = await headers()
    const defaultLocale = (headersList.get('x-next-locale') === 'az' ? 'az' : 'en') as 'az' | 'en'
    const geoCountryRaw = headersList.get('x-next-geo-country')
    const geoCountry = geoCountryRaw ? geoCountryRaw.toUpperCase().slice(0, 2) : undefined
    const htmlLang = defaultLocale === 'az' ? 'az' : 'en'

    return (
        <html lang={htmlLang} className={outfit.variable} data-scroll-behavior="smooth">
            <body>
                <AuthProvider>
                    <LocaleProvider defaultLocale={defaultLocale} geoCountry={geoCountry}>
                        <ProductsProvider>
                            <FavoritesProvider>
                                <CartProvider>
                                    <Suspense fallback={null}>
                                        <Layout>{children}</Layout>
                                    </Suspense>
                                </CartProvider>
                            </FavoritesProvider>
                        </ProductsProvider>
                    </LocaleProvider>
                </AuthProvider>
                {process.env.NEXT_PUBLIC_GA_ID ? (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                ) : null}
            </body>
        </html>
    )
}
