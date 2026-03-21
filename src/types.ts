export interface ProductVariant {
  skuColor: string
  color: string
  price: number
  discountedPrice?: number
  image: string
  images: string[]
  sizes: string[]
  fabric?: string
  isDiscounted?: boolean
  isNewCollection?: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  salePrice?: number
  image: string
  images?: string[]
  colors: { name: string; hex: string }[]
  sizes: string[]
  category: 'men' | 'women'
  fabric?: string
  isNew?: boolean
  onSale?: boolean
  /** Color variants (same SKU, different skuColor); from API */
  variants?: ProductVariant[]
}

export interface CartItem {
  product: Product
  /** Index into product.variants (or 0 if no variants) */
  variantIndex: number
  size: string
  quantity: number
}

export interface Article {
  id: string
  title: string
  excerpt: string
  image: string
  slug: string
  date: string
  url?: string
}
