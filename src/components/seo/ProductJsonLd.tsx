import type { Product } from '@/types'
import { translations } from '@/locales/translations'

type Props = {
  product: Product
  siteUrl: string
  locale: 'az' | 'en'
}

/**
 * Product + BreadcrumbList JSON-LD for rich results (server-rendered).
 */
export default function ProductJsonLd({ product, siteUrl, locale }: Props) {
  const url = `${siteUrl}/shop/${encodeURIComponent(product.slug)}`
  const price = product.salePrice ?? product.price
  const currency = 'AZN'
  const t = translations[locale]
  const displayName =
      locale === 'az' && product.nameAz?.trim() ? product.nameAz.trim() : product.name

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'Vorton' },
    image: product.image ? [product.image] : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: String(price),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: siteUrl },
      { '@type': 'ListItem', position: 2, name: t.shop, item: `${siteUrl}/shop` },
      { '@type': 'ListItem', position: 3, name: displayName, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}
