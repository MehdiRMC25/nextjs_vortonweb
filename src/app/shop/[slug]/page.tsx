'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProducts } from '@/context/ProductsContext'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { variantHasValidColor } from '@/api/products'
import { displayColorName } from '@/lib/colorTranslation'
import ProductCard from '@/components/ProductCard'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { Product } from '@/types'
import styles from './ProductDetail.module.css'

const SIMILAR_LIMIT = 6

function toTeaser(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (words.length <= maxWords) return text.trim()
    return `${words.slice(0, maxWords).join(' ')}…`
}

function getWords(name: string): string[] {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(/\W+/)
        .filter(Boolean)
}

function getSimilarProducts(current: Product, all: Product[], limit: number): Product[] {
    const currentWords = getWords(current.name)
    const scored = all
        .filter((p) => p.id !== current.id)
        .map((p) => {
            const otherWords = getWords(p.name)
            const matchCount = currentWords.filter((w) => otherWords.includes(w)).length
            return { product: p, matchCount }
        })
        .filter(({ matchCount }) => matchCount >= 1)
        .sort((a, b) => b.matchCount - a.matchCount)
    return scored.slice(0, limit).map(({ product }) => product)
}

export default function ProductDetail() {
    const { t, locale } = useLocale()
    const { slug } = useParams<{ slug: string }>()
    const router = useRouter()
    const { addItem } = useCart()
    const { products, loading } = useProducts()
    const product = products.find((p) => p.slug === slug)

    const [selectedColor, setSelectedColor] = useState(0)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [mainImage, setMainImage] = useState(0)

    const variant = product?.variants?.[selectedColor]
    const images = variant?.images?.length
        ? variant.images
        : (product?.images?.length ? product.images : product ? [product.image] : [])
    const displayPrice = variant
        ? (variant.discountedPrice ?? variant.price)
        : (product ? (product.salePrice ?? product.price) : 0)
    const hasSale = variant ? !!variant.isDiscounted : (product ? !!(product.onSale && product.salePrice) : false)
    const sizes = variant?.sizes?.length ? variant.sizes : (product?.sizes || [])
    const fabric = variant?.fabric ?? product?.fabric
    const effectiveSize = selectedSize ?? sizes[0]
    const [descExpanded, setDescExpanded] = useState(false)

    useEffect(() => {
        setMainImage(0)
        setSelectedSize(null)
    }, [selectedColor])

    const validColorSwatches = useMemo(() => {
        if (!product?.variants?.length) return (product?.colors ?? []).map((c, i) => ({ variantIndex: i, color: c }))
        return product!.variants!
            .map((v, i) => ({ variantIndex: i, variant: v, color: product!.colors[i] }))
            .filter(({ variant }) => variant && variantHasValidColor(variant))
            .map(({ variantIndex, color }) => ({ variantIndex, color: color || { name: 'Grey', hex: '#6b7280' } }))
    }, [product?.variants, product?.colors])

    const selectedColorName = useMemo(() => {
        const found = validColorSwatches.find((s) => s.variantIndex === selectedColor)
        return found?.color?.name?.trim() || ''
    }, [validColorSwatches, selectedColor])

    const selectedColorNameUi = useMemo(() => {
        return selectedColorName ? displayColorName(selectedColorName, locale) : ''
    }, [selectedColorName, locale])

    useEffect(() => {
        if (product && validColorSwatches.length > 0) {
            const validIndices = new Set(validColorSwatches.map((s) => s.variantIndex))
            if (!validIndices.has(selectedColor)) {
                setSelectedColor(validColorSwatches[0].variantIndex)
            }
        }
    }, [product?.id, validColorSwatches, selectedColor])

    const similarProducts = useMemo(() => {
        if (!product) return []
        return getSimilarProducts(product, products, SIMILAR_LIMIT)
    }, [product, products])

    const productPageTag = product
        ? `product:${product.slug} · ${product.name}`
        : slug
          ? `product:${slug}`
          : undefined

    if (loading) {
        return (
            <>
                <div className="container">
                    <p>{t('loading')}</p>
                </div>
                <WhatsAppButton pageTag={productPageTag} />
            </>
        )
    }

    if (!product) {
        return (
            <>
                <div className="container">
                    <p>{t('productNotFound')}</p>
                    <button className="btn btn-secondary" onClick={() => router.push('/shop')}>
                        {t('backToShop')}
                    </button>
                </div>
                <WhatsAppButton pageTag={productPageTag} />
            </>
        )
    }

    const p = product
    const variantIndex = p.variants?.length ? selectedColor : 0
    const categoryLabel = p.category === 'women' ? (locale === 'az' ? 'qadınlar' : 'women') : (locale === 'az' ? 'kişilər' : 'men')
    const fabricLabel =
        typeof fabric === 'string' && fabric.trim()
            ? fabric.trim()
            : (locale === 'az' ? 'yumşaq parça' : 'soft fabric')

    const skuDescriptions: Partial<Record<string, { en: string; az: string }>> = {
        'BLS-SLK-L-370': {
            en: 'A refined everyday staple designed for movement and ease, this piece combines modern style with exceptional comfort. Crafted from a soft-touch fabric, it offers a clean silhouette that feels as good as it looks. The versatile design transitions effortlessly from workdays to weekends, making it suitable for a variety of settings. Pair it with denim for a relaxed outfit or with tailored pieces for a more polished appearance. Thoughtful construction ensures it holds its shape over time while remaining breathable and comfortable throughout the day. Easy to layer across seasons, it adapts well to changing weather and styling needs. Durable yet lightweight, this piece is designed to be worn repeatedly without losing its form or appeal, making it a dependable choice.',
            az: 'Hərəkət və rahatlıq üçün hazırlanmış gündəlik, zövqlü seçim. Bu model yumşaq toxunuşlu komfortu və təmiz silueti birləşdirərək səliqəli görünüş yaradır, iş günlərindən həftəsonuna asanlıqla uyğunlaşır. Cinslə də, klassik şalvarla da rahat kombin olunur. Düşünülmüş detalları sayəsində formanı yaxşı saxlayır, qat-qat geyimdə gözəl görünür və gün ərzində rahat qalır. Hər mövsüm üçün etibarlı seçimdir.',
        },
    }

    const overridden = skuDescriptions[p.sku]
    const overriddenFull = overridden ? (locale === 'az' ? overridden.az : overridden.en) : null

    const generatedTeaser =
        locale === 'az'
            ? `${p.name} — ${categoryLabel} üçün premium gündəlik geyim. ${fabricLabel} toxuması, rahat oturuş və hər gün üçün uyğun görünüş. Müasir, minimal üslubla garderobunu yenilə.`
            : `${p.name} is premium everyday wear for ${categoryLabel}. Crafted in ${fabricLabel} with a comfortable fit and clean look, it’s an easy staple for workdays, weekends, and travel.`

    const generatedFull =
        locale === 'az'
            ? `${p.name} — ${categoryLabel} üçün premium gündəlik geyimdir. ${fabricLabel} toxuması günboyu rahatlıq verir, təmiz və müasir siluet isə həm gündəlik, həm də səliqəli kombinlər üçün uyğundur. Ölçünü seçin, rəngi bəyənin və səbətə əlavə edərək sifarişinizi rahatlıqla tamamlayın.`
            : `${p.name} is premium everyday wear for ${categoryLabel}. Made in ${fabricLabel}, it’s designed for all‑day comfort with a clean, modern silhouette that pairs easily with your existing wardrobe. Choose your size and color, then add to cart to check out in minutes.`

    const full = overriddenFull ?? generatedFull
    const teaser = overriddenFull ? toTeaser(overriddenFull, 28) : generatedTeaser

    function handleAddToCart() {
        addItem({
            product: p,
            variantIndex,
            size: effectiveSize ?? '',
            quantity,
        })
        router.push('/cart')
    }

    return (
        <>
        <div className="container">
            <button className={styles.back} onClick={() => router.back()}>
                {t('back')}
            </button>

            <div className={styles.wrap}>
                <div className={styles.gallery}>
                    <div className={styles.mainImage}>
                        <img
                            src={images[mainImage] || p.image}
                            alt={p.name}
                            className={styles.mainImageImg}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </div>
                    <div className={styles.thumbnails}>
                        {images.map((src, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`${styles.thumb} ${i === mainImage ? styles.thumbActive : ''}`}
                                onClick={() => setMainImage(i)}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className={styles.thumbImage}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.info}>
                    <h1 className={styles.title}>{p.name}</h1>
                    <p className={styles.sku}>SKU: {p.sku}</p>

                    {validColorSwatches.length > 0 && (
                        <div className={styles.row}>
                            <div className={styles.colorLine}>
                                <span className={styles.colorLabel}>{t('color')}:</span>
                                {selectedColorNameUi && <span className={styles.colorValue}>{selectedColorNameUi}</span>}
                            </div>
                            <div className={styles.colorSwatches}>
                                {validColorSwatches.map(({ variantIndex, color }) => (
                                    <button
                                        key={`${color.name}-${variantIndex}`}
                                        type="button"
                                        className={`${styles.colorBtn} ${variantIndex === selectedColor ? styles.colorBtnActive : ''}`}
                                        style={{ background: color.hex }}
                                        onClick={() => setSelectedColor(variantIndex)}
                                        title={displayColorName(color.name, locale)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.price}>
                        {hasSale && variant && (
                            <span className={styles.priceOriginal}>₼{variant.price.toFixed(2)}</span>
                        )}
                        {hasSale && !variant && p.salePrice != null && (
                            <span className={styles.priceOriginal}>₼{p.price.toFixed(2)}</span>
                        )}
                        <span className={hasSale ? styles.priceSale : styles.priceCurrent}>
              ₼{displayPrice.toFixed(2)}
            </span>
                    </div>

                    {fabric && (
                        <div className={styles.fabric}>
                            <span className={styles.label}>{t('fabric')}</span>
                            <p className={styles.fabricValue}>{fabric}</p>
                        </div>
                    )}

                    <section className={styles.description} aria-label={locale === 'az' ? 'Məhsul təsviri' : 'Product description'}>
                        <h2 className={styles.descriptionTitle}>{locale === 'az' ? 'Təsvir' : 'Description'}</h2>
                        <p className={styles.descriptionText}>{descExpanded ? full : teaser}</p>
                        <button
                            type="button"
                            className={styles.descriptionToggle}
                            onClick={() => setDescExpanded((v) => !v)}
                            aria-expanded={descExpanded}
                        >
                            {descExpanded ? (locale === 'az' ? 'Daha az' : 'Read less') : (locale === 'az' ? 'Daha çox' : 'Read more')}
                        </button>
                    </section>

                    {sizes.length > 0 && (
                        <div className={styles.row}>
                            <span className={styles.label}>{t('selectSize')}</span>
                            <div className={styles.sizes}>
                                {sizes.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`${styles.sizeBtn} ${effectiveSize === s ? styles.sizeBtnActive : ''}`}
                                        onClick={() => setSelectedSize(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.row}>
                        <span className={styles.label}>{t('quantity')}</span>
                        <div className={styles.qty}>
                            <button
                                type="button"
                                className={styles.qtyBtn}
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                −
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                type="button"
                                className={styles.qtyBtn}
                                onClick={() => setQuantity((q) => q + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        className={styles.addToCart}
                        onClick={handleAddToCart}
                        disabled={sizes.length > 0 && !effectiveSize}
                    >
                        {t('addToCart')} — ₼{(displayPrice * quantity).toFixed(2)}
                    </button>
                </div>
            </div>

            {similarProducts.length > 0 && (
                <section className={styles.similar}>
                    <h2 className={styles.similarTitle}>{t('similarProducts')}</h2>
                    <div className={styles.similarGrid}>
                        {similarProducts.map((prod, index) => (
                            <ProductCard
                                key={prod.id}
                                product={prod}
                                compact
                                imageLoading={index < 4 ? 'eager' : 'lazy'}
                                imageFetchPriority={index < 4 ? (index === 0 ? 'high' : 'auto') : undefined}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
        <WhatsAppButton pageTag={productPageTag} />
        </>
    )
}
