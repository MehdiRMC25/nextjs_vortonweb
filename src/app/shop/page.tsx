'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useProducts } from '@/context/ProductsContext'
import { useLocale } from '@/context/LocaleContext'
import ProductCard from '@/components/ProductCard'
import FilterLayout from '@/components/FilterLayout'
import { CircularProgress } from '@/components/CircularProgress'
import type { Product } from '@/types'
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

export default function Shop() {
    const { t } = useLocale()
    const searchParams = useSearchParams()
    const router = useRouter()
    const category = (searchParams.get('category') as 'men' | 'women' | null) || null
    const { products, loading, error, retry } = useProducts()
    const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())
    const [selectedColor, setSelectedColor] = useState<string>('')
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [showRefresh, setShowRefresh] = useState(false)

    useEffect(() => {
        const color = searchParams.get('color')
        const size = searchParams.get('size')
        if (color) setSelectedColor(color)
        if (size) setSelectedSize(size)
    }, [searchParams])

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
        return list
    }, [byCategory, selectedColor, selectedSize])

    return (
        <FilterLayout
            category={category}
            setCategory={setCategory}
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
                    <p className={styles.empty}>{t('noProductsMatch')}</p>
                    <button type="button" className={styles.refreshBtn} onClick={() => retry()}>
                        {t('retryOrReload')}
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((p) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            selectedColorFilter={selectedColor || undefined}
                            onImageError={onImageError}
                        />
                    ))}
                </div>
            )}
        </FilterLayout>
    )
}
