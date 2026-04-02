const STORAGE_KEY = 'vorton-favorites-v1'

export type FavoriteKey = string

export function getFavoriteKey(input: {
  skuColor?: string | null | undefined
  id?: string | null | undefined
  sku?: string | null | undefined
}): FavoriteKey {
  const skuColor = (input.skuColor ?? '').toString().trim()
  if (skuColor) return skuColor
  const id = (input.id ?? '').toString().trim()
  if (id) return id
  const sku = (input.sku ?? '').toString().trim()
  return sku
}

export function loadFavorites(): Set<FavoriteKey> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((x) => String(x)).filter(Boolean))
  } catch {
    return new Set()
  }
}

export function saveFavorites(favs: Iterable<FavoriteKey>): void {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(favs).map((x) => String(x)).filter(Boolean)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    // ignore
  }
}

