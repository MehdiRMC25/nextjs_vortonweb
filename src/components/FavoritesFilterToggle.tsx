'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './FavoritesFilterToggle.module.css'

export default function FavoritesFilterToggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (next: boolean) => void
}) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      className={`${styles.toggle} ${enabled ? styles.enabled : ''}`}
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span className={styles.heart} aria-hidden="true">
        {enabled ? '♥' : '♡'}
      </span>
      {t('favorites')}
    </button>
  )
}

