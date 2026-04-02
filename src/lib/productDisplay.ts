import type { Product } from '@/types'

/** Shown title: Azerbaijani catalog name on vorton.az when available. */
export function productDisplayName(product: Product, locale: string): string {
  if (locale === 'az' && product.nameAz?.trim()) return product.nameAz.trim()
  return product.name
}
