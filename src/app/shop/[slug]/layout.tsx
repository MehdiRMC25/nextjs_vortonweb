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
  const locale = h.get('x-next-locale') === 'az' ? 'az' : 'en'

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

  const displayName =
      locale === 'az' && product.nameAz?.trim() ? product.nameAz.trim() : product.name
  const catLabel =
      product.category === 'women'
          ? locale === 'az'
              ? 'Qadın'
              : 'Women'
          : locale === 'az'
              ? 'Kişi'
              : 'Men'
  const title = `${catLabel} ${displayName}`
  const description =
      locale === 'az' && product.descriptionAz?.trim()
          ? product.descriptionAz.trim()
          : locale === 'az'
              ? `${displayName} — Vorton mağazasında. Qiymətlər ₼ ilə. Təhlükəsiz ödəniş.`
              : `Shop ${product.name} at Vorton. Premium ${product.category === 'women' ? "women's" : "men's"} fashion — prices in ₼. Secure checkout.`

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
      images: product.image ? [{ url: product.image, alt: displayName }] : undefined,
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
  const locale = h.get('x-next-locale') === 'az' ? 'az' : 'en'

  return (
      <>
        {product ? <ProductJsonLd product={product} siteUrl={siteUrl} locale={locale} /> : null}
      {children}
    </>
  )
}
