'use client'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useLocale } from '@/context/LocaleContext'
import FilterSidebar, { type FilterSidebarProps } from './FilterSidebar'
import styles from './FilterLayout.module.css'

export interface FilterLayoutProps extends FilterSidebarProps {
  children: ReactNode
}

export default function FilterLayout({
  children,
  category,
  setCategory,
  favoritesOnly,
  setFavoritesOnly,
  newOnly,
  setNewOnly,
  saleOnly,
  setSaleOnly,
   priceSort,
  setPriceSort,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  colors,
  sizes,
  loading,
                                     }: FilterLayoutProps) {
  const { t } = useLocale()
  const [sheet, setSheet] = useState<null | 'filters' | 'sort'>(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => {
      const narrow = mq.matches
      setIsNarrow(narrow)
      if (!narrow) setSheet(null)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const filterSidebarProps = {
    category,
    setCategory,
    favoritesOnly,
    setFavoritesOnly,
    newOnly,
    setNewOnly,
    saleOnly,
    setSaleOnly,
    priceSort,
    setPriceSort,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    colors,
    sizes,
    loading,
  }

  return (
      <div className={styles.layout}>
        <div className={styles.mobileFilterBar}>
          <button type="button" className={styles.mobileFilterBtn} onClick={() => setSheet('filters')}>
            {t('shopFilters')}
          </button>
          <button type="button" className={styles.mobileFilterBtn} onClick={() => setSheet('sort')}>
            {t('shopSort')}
          </button>
        </div>
        {!isNarrow && (
            <aside className={styles.sidebar}>
              <FilterSidebar {...filterSidebarProps} />
            </aside>
        )}
        {isNarrow && sheet && (
            <>
              <button
                  type="button"
                  className={styles.sheetBackdrop}
                  aria-label={t('sheetClose')}
                  onClick={() => setSheet(null)}
              />
              <div
                  className={styles.sheet}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="shop-filter-sheet-title"
              >
                <div className={styles.sheetHeader}>
                  <h2 id="shop-filter-sheet-title" className={styles.sheetTitle}>
                    {sheet === 'filters' ? t('shopFilters') : t('shopSort')}
                  </h2>
                  <button
                      type="button"
                      className={styles.sheetClose}
                      aria-label={t('sheetClose')}
                      onClick={() => setSheet(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.sheetBody}>
                  {sheet === 'filters' ? (
                      <FilterSidebar {...filterSidebarProps} showPrice={false} compact />
                  ) : (
                      <FilterSidebar
                          {...filterSidebarProps}
                          showBrand={false}
                          showFavorites={false}
                          showGender={false}
                          showColor={false}
                          showSize={false}
                          compact
                      />
                  )}
                </div>
              </div>
            </>
        )}
        <div className={styles.main}>{children}</div>
      </div>
  )
}
