'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from '../context/LocaleContext'
import { variantHasValidColor } from '../api/products'
import { displayColorName } from '@/lib/colorTranslation'
import type { Product } from '../types'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  onImageError?: (productId: string) => void
  /** Smaller card for similar-products sections */
  compact?: boolean
  /** When set, show only this color variant (image, swatches) instead of all variants */
  selectedColorFilter?: string
}

export default function ProductCard({ product, onImageError, compact, selectedColorFilter }: ProductCardProps) {
  const { t, locale } = useLocale()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleError = () => {
    setImageError(true)
    onImageError?.(product.id)
  }

  /** When color filter active, use the matching variant; otherwise use first/default */
  const displayVariant = useMemo(() => {
    if (!selectedColorFilter?.trim() || !product.variants?.length || !product.colors?.length) return null
    const filterLower = selectedColorFilter.trim().toLowerCase()
    const idx = product.colors.findIndex((c) => c.name?.trim().toLowerCase() === filterLower)
    if (idx >= 0 && product.variants[idx]) return product.variants[idx]
    const fallback = product.variants.find(
      (v) => v.color?.trim().toLowerCase() === filterLower
    )
    return fallback ?? null
  }, [product.variants, product.colors, selectedColorFilter])

  const displayImage = displayVariant?.image ?? product.image
  const displaySizes = displayVariant?.sizes ?? product.sizes
  const displayPrice = displayVariant
    ? (displayVariant.discountedPrice ?? displayVariant.price)
    : (product.salePrice ?? product.price)
  const hasSale = displayVariant
    ? (displayVariant.isDiscounted || (displayVariant.discountedPrice != null && displayVariant.discountedPrice < displayVariant.price))
    : (product.onSale && product.salePrice != null)
  const priceOriginal = displayVariant ? displayVariant.price : product.price

  /** When color filter active, show only that color; otherwise show all valid variant colors */
  const displayColors = useMemo(() => {
    if (displayVariant && product.variants && product.colors) {
      const idx = product.variants.indexOf(displayVariant)
      if (idx >= 0 && product.colors[idx]) {
        return [product.colors[idx]]
      }
      const colorName = displayVariant.color?.trim() || 'Grey'
      return [{ name: colorName, hex: '#6b7280' }]
    }
    if (!product.variants?.length) return product.colors
    return product.colors.filter((_, i) => variantHasValidColor(product.variants![i]))
  }, [product.colors, product.variants, displayVariant])

  if (imageError) return null

  if (!imageLoaded) {
    return (
      <div className={`${styles.card} ${compact ? styles.cardCompact : ''}`} aria-hidden>
        <div className={styles.imageWrap}>
          <div className={styles.imagePlaceholder} />
          <img
            src={displayImage}
            alt=""
            className={styles.imageHidden}
            onLoad={() => setImageLoaded(true)}
            onError={handleError}
          />
        </div>
        <div className={styles.body}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
          <div className={styles.skeletonLine} />
        </div>
      </div>
    )
  }

  return (
    <Link href={`/shop/${product.slug}`} className={`${styles.card} ${compact ? styles.cardCompact : ''}`}>
      <div className={styles.imageWrap}>
        <img src={displayImage} alt={product.name} className={styles.image} />
        {hasSale && <span className={styles.saleBadge}>{t('sale')}</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.sku}>SKU: {product.sku}</p>
        <div className={styles.colors}>
          {displayColors.map((c, i) => (
            <span
              key={`${c.name}-${i}`}
              className={styles.colorDot}
              style={{ background: c.hex }}
              title={displayColorName(c.name, locale)}
            />
          ))}
        </div>
        <p className={styles.sizes}>{t('sizesLabel')}: {displaySizes.join(', ')}</p>
        <div className={styles.priceRow}>
          {hasSale && (
            <span className={styles.priceOriginal}>₼{priceOriginal.toFixed(2)}</span>
          )}
          <span className={hasSale ? styles.priceSale : styles.price}>
            ₼{displayPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  )
}
