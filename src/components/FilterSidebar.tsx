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
}: FilterSidebarProps) {
  const { t, locale } = useLocale()

  return (
    <>
      <div className={styles.sidebarBrand}>
        <span className={styles.sidebarTitle}>
          <span className={styles.brandWord}>
            <span className={styles.brandV}>V</span>orton
          </span>
          <span className={styles.brandTagline}>where style meets comfort.</span>
        </span>
      </div>

      <div className={`${styles.filterBlock} ${styles.favoritesBlock}`}>
        <FavoritesFilterToggle enabled={favoritesOnly} onChange={setFavoritesOnly} />
      </div>

      <div className={styles.filterBlock}>
        <label className={styles.filterLabel} htmlFor="filter-gender">
          {t('gender')}
        </label>
        <select
          id="filter-gender"
          className={styles.select}
          value={category ?? ''}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('all')}</option>
          <option value="men">{t('men')}</option>
          <option value="women">{t('women')}</option>
        </select>
      </div>

      <div className={styles.filterBlock}>
        <ScrollSelect
          id="filter-color"
          label={t('color')}
          value={selectedColor}
          options={colors.map((c) => ({ value: c, label: displayColorName(c, locale) }))}
          placeholder={t('allColors')}
          onChange={setSelectedColor}
          disabled={loading}
        />
      </div>

      <div className={styles.filterBlock}>
        <ScrollSelect
          id="filter-size"
          label={t('size')}
          value={selectedSize}
          options={sizes.map((s) => ({ value: s, label: s }))}
          placeholder={t('allSizes')}
          onChange={setSelectedSize}
          disabled={loading}
        />
      </div>

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
          onChange={(v) => setPriceSort(v as '' | 'priceAsc' | 'priceDesc')}
          disabled={loading}
        />
      </div>
    </>
  )
}
