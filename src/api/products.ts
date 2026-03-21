import { config, cloudinaryUrl } from '../config'
import type { ApiProductDoc } from './types'
import type { Product, ProductVariant } from '../types'

/** Map color names (and skuColor suffixes) to hex for swatches. */
const COLOR_HEX: Record<string, string> = {
  /* Base colors */
  Grey: '#6b7280',
  Gray: '#6b7280',
  Black: '#1a1a1a',
  White: '#f5f5f5',
  Red: '#dc2626',
  Blue: '#2563eb',
  Green: '#16a34a',
  Purple: '#7c3aed',
  Pink: '#ec4899',
  Orange: '#f97316',
  Yellow: '#eab308',
  Brown: '#92400e',
  Beige: '#d4a574',
  Cream: '#fef3c7',
  Navy: '#1e3a5f',
  Olive: '#84cc16',
  Maroon: '#881337',
  Burgundy: '#9f1239',
  Khaki: '#a3a36e',
  Teal: '#0d9488',
  Mint: '#6ee7b7',
  Lavender: '#a78bfa',
  Charcoal: '#374151',
  /* Grey variants */
  'Light Grey': '#9ca3af',
  'Light-Grey': '#9ca3af',
  'Dark-Grey': '#4b5563',
  'Smoke-Grey': '#64748b',
  'Steel-Grey': '#475569',
  'Graphite-Grey': '#374151',
  'Ash-Grey': '#6b7280',
  /* Red variants */
  'Dark-Red': '#991b1b',
  /* Pink variants */
  'Hot Pink': '#ff69b4',
  'Hot-Pink': '#ff69b4',
  'Pastel-Pink': '#fce7f3',
  'Pastel-Blue': '#dbeafe',
  /* Blue variants */
  'Dark Blue': '#1e3a5f',
  'Dark-Blue': '#1e3a5f',
  'Light Blue': '#38bdf8',
  'Light-Blue': '#38bdf8',
  'Sky Blue': '#0ea5e9',
  'Sky-Blue': '#0ea5e9',
  'Navy Blue': '#1e3a5f',
  'Navy-Blue': '#1e3a5f',
  'Royal Blue': '#1d4ed8',
  'Midnight Blue': '#1e293b',
  'Electric Blue': '#00bfff',
  'Electric-blue': '#00bfff',
  'Ice-Blue': '#87ceeb',
  'Turquoise': '#40e0d0',
  'Aqua': '#00ffff',
  'Denim-Blue': '#1560bd',
  'Cerulean-Blue': '#0284c7',
  'Sapphire-Blue': '#0c4a6e',
  'Smoky-Blue': '#64748b',
  /* Green variants */
  'Light-Green': '#86efac',
  'Dark-Green': '#166534',
  'Emerald-Green': '#10b981',
  'Pastel-Green': '#dcfce7',
  /* Teal variants */
  'Light-Teal': '#5eead4',
  'Dark-Teal': '#0f766e',
  /* Purple variants */
  'Dark Purple': '#4c1d95',
  'Pastel-Purple': '#f3e8ff',
  'Deep-Purple': '#581c87',
  'Lilac': '#c8a2c8',
  'Plum': '#581c87',
  /* Yellow variants */
  'Mustard': '#ca8a04',
  'Pastel-Yellow': '#fef9c3',
  /* Deep variants */
  'Deep-Blue': '#1e3a5f',
  'Deep-Green': '#14532d',
  'Deep-Red': '#7f1d1d',
  /* Brown variants */
  'Dark-Brown': '#78350f',
  'Chocolate': '#5c4033',
  'Chocolate-Brown': '#5c4033',
  'Coffee-Brown': '#6f4e37',
  'Earth-Brown': '#78350f',
  'Caramel': '#d2691e',
  'Terracotta': '#c2410c',
  'Brick-Red': '#b91c1c',
  /* Neutrals */
  'Ivory': '#fffff0',
  'Tan': '#d2b48c',
  'Camel': '#c19a6b',
  'Sand': '#c2b280',
  'Off-White': '#f8f8f8',
  /* Metallics */
  'Gold': '#eab308',
  'Silver': '#9ca3af',
  'Bronze': '#cd7f32',
  'Copper': '#b87333',
  'Rose-Gold': '#b76e79',
  /* Other */
  'Coral': '#fb7185',
  'Peach': '#ffdab9',
  'Champagne': '#f7e7ce',
  'Wine-Burgundy': '#722f37',
  'Blue-green': '#0d9488',
  'Blue-Black': '#1e3a5f',
  'Blue-White': '#2563eb',
  'White-Blue': '#2563eb',
  'Green-Black': '#166534',
  'Green-White': '#86efac',
  'Navy-Black': '#1e3a5f',
  'Navy-White': '#1e3a5f',
  'Black-Red': '#991b1b',
  'Black-White': '#4b5563',
  'White-Black': '#4b5563',
  'Red-Black': '#991b1b',
  'Red-White': '#dc2626',
  'Yellow-Black': '#ca8a04',
  'Yellow-White': '#eab308',
  'Orange-Black': '#ea580c',
  'Pink-White': '#ec4899',
  'Purple-Black': '#581c87',
  'Grey-Black': '#4b5563',
  'Grey-White': '#9ca3af',
  'Black-Grey': '#374151',
  'Brown-White': '#92400e',
  'Beige-White': '#d4a574',
  'Blue-Grey': '#64748b',
  'Olive-Black': '#4d7c0f',
  'Cream-Brown': '#d4a574',
  'Cream-Nude': '#f5e6d3',
  'Cream-Khaki': '#c3b091',
  'Purple-cream': '#e9d5ff',
  'Grey-cream': '#d1d5db',
  'Black-Tiger': 'radial-gradient(ellipse 35% 40% at 20% 30%, #2d1f0f 0%, #1a1a1a 30%, transparent 70%), radial-gradient(ellipse 30% 35% at 70% 60%, #2d1f0f 0%, #1a1a1a 25%, transparent 65%), radial-gradient(ellipse 25% 30% at 50% 85%, #1a1a1a 0%, #3d2914 40%, transparent 70%), radial-gradient(ellipse 28% 32% at 85% 20%, #2d1f0f 0%, transparent 60%), #d4b896',
  'Ruby-Red': '#be123c',
  'Multicolour': '#6b7280',
  Indigo: '#4f46e5',
  'İndigo': '#4f46e5',
  /* Azeri */
  Boz: '#8b7355',
  Mavi: '#2563eb',
  'Tünd mavi': '#1e3a5f',
  'Tünd Mavi': '#1e3a5f',
  Bənövşəyi: '#7c3aed',
  Qara: '#1a1a1a',
  Ağ: '#f5f5f5',
  Qırmızı: '#dc2626',
  Yaşıl: '#16a34a',
  Narıncı: '#f97316',
  Velvet: '#722f37',
}

/** Numeric SKU-Color codes (last segment when it's a number, e.g. SET-OYS-L-326 → 326). Extend as needed. */
const NUMERIC_COLOR_CODES: Record<string, string> = {
  '326': 'Navy',
  '344': 'Blue',
  '356': 'Electric Blue',
  '364': 'Olive',
  '319': 'Charcoal',
  '320': 'Purple',
  /* Add more as you discover product codes */
}

/** Aliases: alternate spellings or API values that should map to a known key. */
const COLOR_ALIASES: Record<string, string> = {
  navy: 'Navy',
  blue: 'Blue',
  purple: 'Purple',
  black: 'Black',
  white: 'White',
  grey: 'Grey',
  gray: 'Gray',
  red: 'Red',
  green: 'Green',
  darkblue: 'Dark Blue',
  'dark blue': 'Dark Blue',
  royalblue: 'Royal Blue',
  'royal blue': 'Royal Blue',
  lightblue: 'Light Blue',
  'light blue': 'Light Blue',
  navyblue: 'Navy Blue',
  'navy blue': 'Navy Blue',
  mavi: 'Blue',
  'tünd mavi': 'Dark Blue',
  hotpink: 'Hot Pink',
  'hot pink': 'Hot Pink',
  'hot-pink': 'Hot Pink',
  'white blue': 'Blue',
  'white-blue': 'Blue',
  'blue white': 'Blue',
  'electric blue': 'Electric Blue',
  'electric-blue': 'Electric Blue',
  'navy-blue': 'Navy Blue',
  velvet: 'Velvet',
  'ice-blue': 'Ice-Blue',
  'ice blue': 'Ice-Blue',
  'cream-nude': 'Cream-Nude',
  'cream nude': 'Cream-Nude',
  indigo: 'Indigo',
  'ındigo': 'Indigo',
  multicolour: 'Multicolour',
  'multi-colour': 'Multicolour',
  'blue-green': 'Blue-green',
  'blue green': 'Blue-green',
  'grey-cream': 'Grey-cream',
  'grey cream': 'Grey-cream',
  'purple-cream': 'Purple-cream',
  'purple cream': 'Purple-cream',
}

/** Normalize for lookup: "purple" -> "Purple", "dark blue" -> "Dark Blue". */
function normalizeColorName(s: string): string {
  const t = s.trim()
  if (!t) return ''
  return t.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

function colorToHex(color: string): string {
  if (!color || !color.trim()) return '#6b7280'
  const raw = color.trim()
  const normalized = normalizeColorName(raw)
  const alias = COLOR_ALIASES[raw.toLowerCase()] ?? COLOR_ALIASES[normalized.toLowerCase()]
  const key = alias ?? normalized ?? raw
  return COLOR_HEX[key] ?? COLOR_HEX[raw] ?? COLOR_HEX[normalized] ?? '#6b7280'
}

/** Color modifiers that form compound names: Electric-blue, Dark-blue, Cream-Nude, etc. */
const COLOR_MODIFIERS = new Set([
  'electric', 'dark', 'light', 'royal', 'navy', 'midnight', 'sky', 'hot', 'pale', 'bright',
  'deep', 'soft', 'muted', 'vivid', 'ice', 'steel', 'powder', 'baby', 'true', 'electricblue',
  'cream', 'pastel', 'smoke', 'graphite', 'ash', 'wine', 'earth', 'brick', 'terracotta',
  'caramel', 'coffee', 'chocolate', 'emerald', 'sapphire', 'ruby', 'cerulean', 'smoky',
  'rose', 'denim', 'sand', 'off', 'nude', 'white', 'black', 'grey', 'gray', 'blue', 'green',
  'red', 'yellow', 'orange', 'pink', 'purple', 'brown', 'beige', 'olive',
])

/** Get color name from end of skuColor. Handles "SET-OYS-L-326" -> "326", "X-Blue" -> "Blue", "X-Electric-blue" -> "Electric-blue". */
function getSuffixFromSkuColor(skuColor: string | undefined): string | null {
  if (!skuColor || typeof skuColor !== 'string') return null
  const trimmed = skuColor.trim()
  const parts = trimmed.split('-')
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]?.trim()
  const prev = parts[parts.length - 2]?.trim()
  if (!last) return null
  // Compound color: "Electric-blue", "Dark-blue" etc.
  if (prev && COLOR_MODIFIERS.has(prev.toLowerCase())) {
    const compound = `${prev}-${last}`
    return compound
  }
  return last
}

/** Get color name from end of skuColor. Handles both text ("Blue") and numeric codes ("326" -> Navy). */
function colorNameFromSkuColor(skuColor: string | undefined): string | null {
  const suffix = getSuffixFromSkuColor(skuColor)
  if (!suffix) return null
  if (/^\d+$/.test(suffix)) {
    return NUMERIC_COLOR_CODES[suffix] ?? null
  }
  return suffix
}

/** True if variant has real color from color field or skuColor (not defaulted to Grey). */
export function variantHasValidColor(v: import('../types').ProductVariant): boolean {
  if (v.color?.trim()) return true
  return colorNameFromSkuColor(v.skuColor) != null
}

function slugFromSku(sku: string): string {
  return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || sku
}

/** Only include a doc if it has at least one image (image or images[0]); allow full URL or filename. */
function hasImage(doc: ApiProductDoc): boolean {
  const img = doc.image ?? doc.images?.[0]
  return typeof img === 'string' && img.trim().length > 0
}

/** Use full URL as-is; otherwise build Cloudinary URL from filename (server may already send full URLs). */
function imageUrl(value: string | undefined): string {
  if (!value || !value.trim()) return ''
  const s = value.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  return cloudinaryUrl(s)
}

const PRODUCTS_FETCH_TIMEOUT_MS = 20000

/** Fetch raw product documents from API (with timeout so we don't hang). */
export async function fetchApiProducts(): Promise<ApiProductDoc[]> {
  const path = config.productsPath.startsWith('/') ? config.productsPath : `/${config.productsPath}`
  const url = `${config.apiUrl}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PRODUCTS_FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Products are taking too long to load. The server may be starting up—please try again in a moment.')
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot reach the products server. Check your connection and that the products API URL is correct.')
      }
    }
    throw err
  }
  clearTimeout(timeoutId)
  if (!res.ok) {
    throw new Error(`Products API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  let list: unknown[]
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    list =
      (data as { products?: unknown[] }).products ??
      (data as { data?: unknown[] }).data ??
      (data as { items?: unknown[] }).items ??
      []
  } else {
    list = []
  }
  if (!Array.isArray(list)) {
    const keys = data && typeof data === 'object' ? Object.keys(data as object).join(', ') : 'non-object'
    throw new Error(
      `Products API did not return an array. Got: ${keys || typeof data}. ` +
        `Expected JSON array or object with "products", "data", or "items" array.`
    )
  }
  return list as ApiProductDoc[]
}

/**
 * Group docs by SKU; first doc per SKU is the "main" product.
 * Only include variants that have at least one image.
 * Only include products that have at least one variant with images (no empty cards).
 */
export function buildProductsFromApi(docs: ApiProductDoc[]): Product[] {
  const bySku = new Map<string, ApiProductDoc[]>()
  for (const doc of docs) {
    if (!doc.sku) continue
    const list = bySku.get(doc.sku) || []
    list.push(doc)
    bySku.set(doc.sku, list)
  }

  const products: Product[] = []

  for (const [sku, variants] of bySku) {
    const withImages = variants.filter(hasImage)
    if (withImages.length === 0) continue

    const first = withImages[0]
    const productVariants: ProductVariant[] = withImages.map((d) => {
      const imgList = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.image ? [d.image] : [])
      const colorFromDoc = String(d.color ?? d.rang ?? '').trim()
      return {
        skuColor: d.skuColor ?? (d.sku && colorFromDoc ? `${String(d.sku).trim()}-${colorFromDoc.replace(/\s+/g, '-')}` : ''),
        color: colorFromDoc,
        price: Number(d.price) || 0,
        discountedPrice: d.discountedPrice != null ? Number(d.discountedPrice) : undefined,
        image: imageUrl(d.image ?? d.images?.[0]),
        images: imgList.map((x) => imageUrl(typeof x === 'string' ? x : '')).filter(Boolean),
        sizes: Array.isArray(d.sizes) ? d.sizes : [],
        fabric: d.fabric,
        isDiscounted: d.isDiscounted,
        isNewCollection: d.isNewCollection,
      }
    })

    const v0 = productVariants[0]
    if (!v0.image) continue
    const isNew = productVariants.some((v) => v.isNewCollection)
    const onSale = productVariants.some(
      (v) => v.isDiscounted || (v.discountedPrice != null && v.discountedPrice < v.price)
    )

    const cat = (first.category ?? first.gender ?? '').toString().toLowerCase().trim()
    const category = (cat === 'women' ? 'women' : 'men') as 'men' | 'women'

    const product: Product = {
      id: (first.id ?? first._id ?? sku)?.toString() || sku,
      sku,
      slug: slugFromSku(sku),
      name: (first.name ?? first.sku ?? '').toString().trim() || sku,
      category,
      price: v0.price,
      salePrice: v0.discountedPrice,
      image: v0.image,
      images: v0.images?.length ? v0.images : undefined,
      sizes: v0.sizes,
      fabric: v0.fabric,
      isNew,
      onSale,
      colors: productVariants.map((v) => {
        const colorName = (v.color && v.color.trim()) || colorNameFromSkuColor(v.skuColor) || 'Grey'
        return { name: colorName, hex: colorToHex(colorName) }
      }),
      variants: productVariants,
    }

    products.push(product)
  }

  return products
}

export async function fetchProducts(): Promise<Product[]> {
  const docs = await fetchApiProducts()
  return buildProductsFromApi(docs)
}
