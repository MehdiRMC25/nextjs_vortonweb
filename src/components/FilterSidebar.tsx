import { useLocale } from '../context/LocaleContext'
import ScrollSelect from './ScrollSelect'
import styles from './FilterSidebar.module.css'

export interface FilterSidebarProps {
  category: 'men' | 'women' | null
  setCategory: (value: string) => void
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
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  colors,
  sizes,
  loading = false,
}: FilterSidebarProps) {
  const { t } = useLocale()

  return (
    <>
      <div className={styles.sidebarBrand}>
        <span className={styles.sidebarTitle}>Vorton</span>
        <span className={styles.sidebarTagline}>{t('discoverYourStyle')}</span>
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
          options={colors.map((c) => ({ value: c, label: c }))}
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
    </>
  )
}
