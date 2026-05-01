'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './FavoritesFilterToggle.module.css'

export default function FavoritesFilterToggle({
  enabled,
  onChange,
  compact = false,
}: {
  enabled: boolean
  onChange: (next: boolean) => void
  compact?: boolean
}) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      className={`${styles.toggle}${compact ? ` ${styles.toggleCompact}` : ''} ${enabled ? styles.enabled : ''}`}
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
    >
      <svg className={styles.heart} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4 8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          className={styles.heartPath}
        />
      </svg>
      {t('favorites')}
    </button>
  )
}

