// Raw product document as returned from API (server normalizes from MongoDB; one doc per SKU-Color)

export interface ApiProductDoc {
  id?: string
  _id?: string
  sku: string
  skuColor?: string
  color: string
  name: string
  price: number
  discountedPrice?: number
  image?: string
  images?: string[]
  sizes: string[]
  fabric?: string
  gender?: string
  category?: string
  isDiscounted?: boolean
  isNewCollection?: boolean
  rang?: string
}
