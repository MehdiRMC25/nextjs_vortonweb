import { useLocale } from '../context/LocaleContext'
import ScrollSelect from './ScrollSelect'
import { displayColorName } from '@/lib/colorTranslation'
import FavoritesFilterToggle from '@/components/FavoritesFilterToggle'
import styles from './FilterSidebar.module.css'

export interface FilterSidebarProps {
  category: 'men' | 'women' | null
  setCategory: (value: string) => void
  favoritesOnly: boolean
  setFavoritesOnly: (value: boolean) => void
  priceSort: '' | 'priceAsc' | 'priceDesc'
  setPriceSort: (value: '' | 'priceAsc' | 'priceDesc') => void
  selectedColor: string
  setSelectedColor: (value: string) => void
  selectedSize: string
  setSelectedSize: (value: string) => void
  colors: string[]
  sizes: string[]
  loading?: boolean
  showBrand?: boolean
  showFavorites?: boolean
  showGender?: boolean
  showColor?: boolean
  showSize?: boolean
  showPrice?: boolean
  compact?: boolean
}

export default function FilterSidebar({
  category,
  setCategory,
  favoritesOnly,
  setFavoritesOnly,
  priceSort,
  setPriceSort,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  colors,
  sizes,
  loading = false,
  showBrand = true,
  showFavorites = true,
  showGender = true,
  showColor = true,
  showSize = true,
  showPrice = true,
  compact = false,
}: FilterSidebarProps) {
  const { t, locale } = useLocale()

  return (
      <>
        {showBrand && (
            <div className={`${styles.sidebarBrand}${compact ? ` ${styles.sidebarBrandCompact}` : ''}`}>
          <span className={styles.sidebarTitle}>
            <span className={styles.brandWord}>
              <span className={styles.brandV}>V</span>orton
            </span>
            <span
                className={`${styles.brandTagline}${locale === 'az' ? ` ${styles.brandTaglineAz}` : ''}`}
            >
              {t('brandTagline')}
            </span>
          </span>
            </div>
        )}

        {showFavorites && (
            <div className={`${styles.filterBlock} ${styles.favoritesBlock}`}>
              <FavoritesFilterToggle enabled={favoritesOnly} onChange={setFavoritesOnly} compact={compact} />
            </div>
        )}

        {showGender && (
            <div className={styles.filterBlock}>
              <ScrollSelect
                  id="filter-gender"
                  label={t('gender')}
                  value={category ?? ''}
                  options={[
                    { value: 'men', label: t('men') },
                    { value: 'women', label: t('women') },
                  ]}
                  placeholder={t('all')}
                  clearLabel={t('clearFilter')}
                  onChange={(v) => setCategory(v)}
                  disabled={loading}
                  compact={compact}
              />
            </div>
        )}

        {showColor && (
            <div className={styles.filterBlock}>
              <ScrollSelect
                  id="filter-color"
                  label={t('color')}
                  value={selectedColor}
                  options={colors.map((c) => ({ value: c, label: displayColorName(c, locale) }))}
                  placeholder={t('allColors')}
                  clearLabel={t('clearFilter')}
                  onChange={setSelectedColor}
                  disabled={loading}
                  compact={compact}
              />
            </div>
        )}

        {showSize && (
            <div className={styles.filterBlock}>
              <ScrollSelect
                  id="filter-size"
                  label={t('size')}
                  value={selectedSize}
                  options={sizes.map((s) => ({ value: s, label: s }))}
                  placeholder={t('allSizes')}
                  clearLabel={t('clearFilter')}
                  onChange={setSelectedSize}
                  disabled={loading}
                  compact={compact}
              />
            </div>
        )}

        {showPrice && (
            <div className={styles.filterBlock}>
              <ScrollSelect
                  id="filter-price-sort"
                  label={t('price')}
                  value={priceSort}
                  options={[
                    { value: 'priceDesc', label: `⬆ ${t('priceHighToLow')}` },
                    { value: 'priceAsc', label: `⬇ ${t('priceLowToHigh')}` },
                  ]}
                  placeholder={t('priceSortPlaceholder')}
                  clearLabel={t('clearFilter')}
                  onChange={(v) => setPriceSort(v as '' | 'priceAsc' | 'priceDesc')}
                  disabled={loading}
                  compact={compact}
              />
            </div>
        )}
      </>
  )
}
