import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { ProductsProvider } from '@/context/ProductsContext'
import { CartProvider } from '@/context/CartContext'
import Layout from '@/components/Layout'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-outfit' })

export const metadata: Metadata = {
    title: 'Vorton Fashion — Discover Your Style',
    description: 'Vorton Fashion - Discover Your Style',
    icons: {
        icon: '/vorton_web_favicon.png',
    },
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
    return (
        <html lang="en" className={outfit.variable} data-scroll-behavior="smooth">
        <body>
        <AuthProvider>
            <LocaleProvider defaultLocale={defaultLocale} geoCountry={geoCountry}>
                <ProductsProvider>
                    <CartProvider>
                        <Layout>{children}</Layout>
                    </CartProvider>
                </ProductsProvider>
            </LocaleProvider>
        </AuthProvider>
        </body>
        </html>
    )
}