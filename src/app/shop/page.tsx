'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useProducts } from '@/context/ProductsContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useLocale } from '@/context/LocaleContext'
import ProductCard from '@/components/ProductCard'
import FilterLayout from '@/components/FilterLayout'
import { CircularProgress } from '@/components/CircularProgress'
import type { Product, PriceSortMode } from '@/types'
import styles from './Shop.module.css'

function getUniqueColors(products: Product[]): string[] {
    const set = new Set<string>()
    for (const p of products) {
        for (const c of p.colors) {
            if (c.name?.trim()) set.add(c.name.trim())
        }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function getUniqueSizes(products: Product[]): string[] {
    const set = new Set<string>()
    for (const p of products) {
        for (const s of p.sizes) {
            if (String(s).trim()) set.add(String(s).trim())
        }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function productHasColor(p: Product, color: string): boolean {
    return p.colors.some((c) => c.name.trim().toLowerCase() === color.toLowerCase())
}

function productHasSize(p: Product, size: string): boolean {
    return p.sizes.some((s) => String(s).trim().toLowerCase() === size.toLowerCase())
}

function productMatchesSearchQuery(p: Product, query: string): boolean {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    const parts: string[] = [
        p.name,
        p.nameAz ?? '',
        p.sku,
        p.slug,
        p.fabric ?? '',
        ...p.colors.map((c) => c.name),
        ...p.sizes.map((s) => String(s)),
    ]
    if (p.variants?.length) {
        for (const v of p.variants) {
            parts.push(v.skuColor, v.color, ...v.sizes.map((s) => String(s)))
        }
    }
    return parts.some((s) => s.toLowerCase().includes(needle))
}

export default function Shop() {
    const { t } = useLocale()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { favoritesSet } = useFavorites()
    const category = (searchParams.get('category') as 'men' | 'women' | null) || null
    const searchQuery = (searchParams.get('q') ?? '').trim()
    const { products, loading, error, retry } = useProducts()
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())
    const [showRefresh, setShowRefresh] = useState(false)

    const selectedColor = searchParams.get('color') ?? ''
    const selectedSize = searchParams.get('size') ?? ''
    const favoritesOnly = searchParams.get('favorites') === '1'
    const newOnly = searchParams.get('new') === '1'
    const saleOnly = searchParams.get('sale') === '1'
    const sortParam = searchParams.get('sort')
    const priceSort: PriceSortMode =
        sortParam === 'priceAsc' || sortParam === 'priceDesc' ? sortParam : ''

    useEffect(() => {
        if (error) setShowRefresh(true)
    }, [error])

    useEffect(() => {
        if (!loading) {
            setShowRefresh(false)
            return
        }
        setShowRefresh(false)
        const id = window.setTimeout(() => setShowRefresh(true), 9000)
        return () => window.clearTimeout(id)
    }, [loading])

    const onImageError = useCallback((productId: string) => {
        setFailedImageIds((prev) => new Set(prev).add(productId))
    }, [])

    const setCategory = useCallback(
        (value: string) => {
            const next = new URLSearchParams(searchParams.toString())
            if (value === 'men' || value === 'women') {
                next.set('category', value)
            } else {
                next.delete('category')
            }
            router.replace(`/shop?${next.toString()}`, { scroll: false })
        },
        [searchParams, router]
    )

    const replaceShopQuery = useCallback(
        (mutate: (next: URLSearchParams) => void) => {
            const next = new URLSearchParams(searchParams.toString())
            mutate(next)
            const qs = next.toString()
            router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false })
        },
        [searchParams, router]
    )

    const setSelectedColor = useCallback(
        (value: string) => {
            replaceShopQuery((next) => {
                if (value.trim()) {
                    next.set('color', value.trim())
                } else {
                    next.delete('color')
                }
            })
        },
        [replaceShopQuery]
    )

    const setSelectedSize = useCallback(
        (value: string) => {
            replaceShopQuery((next) => {
                if (value.trim()) {
                    next.set('size', value.trim())
                } else {
                    next.delete('size')
                }
            })
        },
        [replaceShopQuery]
    )

    const setFavoritesOnly = useCallback(
        (value: boolean) => {
            replaceShopQuery((next) => {
                if (value) {
                    next.set('favorites', '1')
                } else {
                    next.delete('favorites')
                }
            })
        },
        [replaceShopQuery]
    )

    const setNewOnly = useCallback(
        (value: boolean) => {
            replaceShopQuery((next) => {
                if (value) {
                    next.set('new', '1')
                } else {
                    next.delete('new')
                }
            })
        },
        [replaceShopQuery]
    )

    const setSaleOnly = useCallback(
        (value: boolean) => {
            replaceShopQuery((next) => {
                if (value) {
                    next.set('sale', '1')
                } else {
                    next.delete('sale')
                }
            })
        },
        [replaceShopQuery]
    )

    const setPriceSort = useCallback(
        (value: PriceSortMode) => {
            replaceShopQuery((next) => {
                if (value === 'priceAsc' || value === 'priceDesc') {
                    next.set('sort', value)
                } else {
                    next.delete('sort')
                }
            })
        },
        [replaceShopQuery]
    )

    const byCategory = useMemo(() => {
        let list = products.filter((p) => !failedImageIds.has(p.id))
        if (category === 'men' || category === 'women') {
            list = list.filter((p) => p.category === category)
        }
        return list
    }, [products, category, failedImageIds])

    const filterOptions = useMemo(() => ({
        colors: getUniqueColors(byCategory),
        sizes: getUniqueSizes(byCategory),
    }), [byCategory])

    const filtered = useMemo(() => {
        let list = byCategory
        if (selectedColor) {
            list = list.filter((p) => productHasColor(p, selectedColor))
        }
        if (selectedSize) {
            list = list.filter((p) => productHasSize(p, selectedSize))
        }
        if (searchQuery) {
            list = list.filter((p) => productMatchesSearchQuery(p, searchQuery))
        }
        if (favoritesOnly) {
            list = list.filter((p) => {
                const productKey = p.id || p.sku
                if (productKey && favoritesSet.has(productKey)) return true
                if (!p.variants?.length) return false
                return p.variants.some((v) => !!v.skuColor && favoritesSet.has(v.skuColor))
            })
        }
        if (newOnly) {
            list = list.filter((p) => p.isNew)
        }
        if (saleOnly) {
            list = list.filter((p) => p.onSale)
        }
        if (priceSort === 'priceAsc' || priceSort === 'priceDesc') {
            list = [...list].sort((a, b) => {
                const ap = a.salePrice ?? a.price
                const bp = b.salePrice ?? b.price
                return priceSort === 'priceAsc' ? ap - bp : bp - ap
            })
        }
        return list
    }, [byCategory, selectedColor, selectedSize, searchQuery, favoritesOnly, favoritesSet, newOnly, saleOnly, priceSort])

    return (
        <FilterLayout
            category={category}
            setCategory={setCategory}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            newOnly={newOnly}
            setNewOnly={setNewOnly}
            saleOnly={saleOnly}
            setSaleOnly={setSaleOnly}
            priceSort={priceSort}
            setPriceSort={setPriceSort}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            colors={filterOptions.colors}
            sizes={filterOptions.sizes}
            loading={loading}
        >
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {category === 'men' ? t('mensCollection') : category === 'women' ? t('womensCollection') : t('shop')}
                </h1>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
                <section className={styles.loadingSection}>
                    <CircularProgress loading={true} size={140} strokeWidth={6} />
                    {showRefresh && (
                        <button
                            type="button"
                            className={styles.refreshBtn}
                            onClick={() => retry()}
                        >
                            {t('retryOrReload')}
                        </button>
                    )}
                </section>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyBlock}>
                    <p className={styles.empty}>
                        {favoritesOnly ? t('noFavoritesYet') : t('noProductsMatch')}
                    </p>
                    {favoritesOnly ? (
                        <button type="button" className={styles.refreshBtn} onClick={() => setFavoritesOnly(false)}>
                            {t('clearFavoritesFilter')}
                        </button>
                    ) : (
                        <button type="button" className={styles.refreshBtn} onClick={() => retry()}>
                            {t('retryOrReload')}
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((p, index) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            selectedColorFilter={selectedColor || undefined}
                            onImageError={onImageError}
                            imageLoading={index < 6 ? 'eager' : 'lazy'}
                            imageFetchPriority={index < 6 ? (index === 0 ? 'high' : 'auto') : undefined}
                        />
                    ))}
                </div>
            )}
        </FilterLayout>
    )
}
