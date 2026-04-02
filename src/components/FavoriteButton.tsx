'use client'

import { useFavorites } from '@/context/FavoritesContext'
import { useLocale } from '@/context/LocaleContext'
import styles from './FavoriteButton.module.css'

export default function FavoriteButton({
  favoriteKey,
  className,
  onClick,
}: {
  favoriteKey: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const { t } = useLocale()
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(favoriteKey)

  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={active ? t('removeFromFavorites') : t('addToFavorites')}
      onClick={(e) => {
        onClick?.(e)
        toggle(favoriteKey)
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        {active ? '♥' : '♡'}
      </span>
    </button>
  )
}

