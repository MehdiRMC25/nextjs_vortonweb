import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getProductBySlug } from '@/api/products'
import ProductJsonLd from '@/components/seo/ProductJsonLd'
import { getCanonicalAndAlternates, getRequestOrigin } from '@/lib/siteUrl'

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  const h = await headers()
  const pathname = `/shop/${slug}`
  const { canonical, alternates } = getCanonicalAndAlternates(h, { pathname, search: '' })

  if (!product) {
    return {
      title: 'Product',
      description: 'Vorton fashion — product page.',
      alternates: {
        canonical,
        languages: {
          'az-AZ': alternates.az,
          'en-GB': alternates.en,
          'x-default': alternates.en,
        },
      },
    }
  }

  const catLabel = product.category === 'women' ? 'Women' : 'Men'
  const title = `${catLabel} ${product.name}`
  const description = `Shop ${product.name} at Vorton. Premium ${product.category === 'women' ? "women's" : "men's"} fashion — prices in ₼. Secure checkout.`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'az-AZ': alternates.az,
        'en-GB': alternates.en,
        'x-default': alternates.en,
      },
    },
    openGraph: {
      title: `${title} | Vorton`,
      description,
      url: canonical,
      type: 'website',
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Vorton`,
      description,
      images: product.image ? [product.image] : undefined,
    },
  }
}

export default async function ShopProductLayout({ children, params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  const h = await headers()
  const siteUrl = getRequestOrigin(h)

  return (
    <>
      {product ? <ProductJsonLd product={product} siteUrl={siteUrl} /> : null}
      {children}
    </>
  )
}
