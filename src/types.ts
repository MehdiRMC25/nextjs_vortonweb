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
  /** Azerbaijani product title (MongoDB `nameAz`) */
  nameAz?: string
  /** English long description (detail API / optional on list) */
  descriptionEn?: string
  /** Azerbaijani long description */
  descriptionAz?: string
  slug: string
  sku: string
  price: number
  salePrice?: number
  image: string
  images?: string[]
  colors: {
    name: string
    hex: string
    ringHex?: string
    hexes?: string[]
    displayNameAz?: string
  }[]
  sizes: string[]
  category: 'men' | 'women'
  fabric?: string
  isNew?: boolean
  onSale?: boolean
  /** Color variants (same SKU, different skuColor); from API */
  variants?: ProductVariant[]
}

/** Shop price ordering only (URL `sort=priceAsc|priceDesc`). New/sale use `new=1` and `sale=1`. */
export type PriceSortMode = '' | 'priceAsc' | 'priceDesc'

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


/** Home page news/promo cards from MongoDB `News` collection (`_id: "home"`). */
export interface HomeNewsItem {
  id: string
  title: string
  titleAz?: string
  imageUrl: string
  link: string
}