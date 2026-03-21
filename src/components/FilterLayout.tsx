import type { ReactNode } from 'react'
import FilterSidebar, { type FilterSidebarProps } from './FilterSidebar'
import styles from './FilterLayout.module.css'

export interface FilterLayoutProps extends FilterSidebarProps {
  children: ReactNode
}

export default function FilterLayout({
  children,
  category,
  setCategory,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  colors,
  sizes,
  loading,
}: FilterLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <FilterSidebar
          category={category}
          setCategory={setCategory}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          colors={colors}
          sizes={sizes}
          loading={loading}
        />
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  )
}
