import type { Metadata } from 'next'
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
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={outfit.variable}>
        <body>
        <AuthProvider>
            <LocaleProvider>
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