import type { Product } from '@/types'

type Props = {
  product: Product
  siteUrl: string
}

/**
 * Product + BreadcrumbList JSON-LD for rich results (server-rendered).
 */
export default function ProductJsonLd({ product, siteUrl }: Props) {
  const url = `${siteUrl}/shop/${encodeURIComponent(product.slug)}`
  const price = product.salePrice ?? product.price
  const currency = 'AZN'

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
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
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
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
