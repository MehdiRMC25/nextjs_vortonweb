'use client'

import { useFavorites } from '@/context/FavoritesContext'
import { useLocale } from '@/context/LocaleContext'
import styles from './FavoriteButton.module.css'

export default function FavoriteButton({
  favoriteKey,
  activeKeys,
  className,
  onClick,
}: {
  favoriteKey: string
  /** If any of these are favorited, button renders active (still toggles favoriteKey). */
  activeKeys?: string[]
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const { t } = useLocale()
  const { isFavorite, add, removeMany } = useFavorites()
  const keysForActive = (activeKeys?.length ? activeKeys : [favoriteKey]).map((k) => String(k ?? '').trim()).filter(Boolean)
  const active = keysForActive.some((k) => isFavorite(k))

  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={active ? t('removeFromFavorites') : t('addToFavorites')}
      onClick={(e) => {
        onClick?.(e)
        if (active) {
          removeMany(keysForActive)
        } else {
          add(favoriteKey)
        }
      }}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="vortonHeartFill" cx="30%" cy="25%" r="80%">
            <stop offset="0%" stopColor="#ffb4b4" stopOpacity="1" />
            <stop offset="35%" stopColor="#ff4a4a" stopOpacity="1" />
            <stop offset="100%" stopColor="#b30000" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="vortonHeartGloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="vortonHeartShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4 8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          className={styles.heartBase}
        />
        <path
          d="M6.3 7.2c.95-1.35 2.55-2.1 4.1-1.95.6.06 1.18.28 1.68.65.2.14.39.31.58.5.19-.19.38-.36.58-.5.5-.37 1.08-.6 1.68-.65 1.55-.15 3.15.6 4.1 1.95.26.37.46.78.58 1.22.2.75.18 1.55-.08 2.33-.45 1.34-1.7 2.76-3.65 4.55-.95.87-2.05 1.77-3.19 2.69-.12.1-.3.1-.42 0-1.14-.92-2.24-1.82-3.19-2.69-1.95-1.79-3.2-3.21-3.65-4.55-.26-.78-.28-1.58-.08-2.33.12-.44.32-.85.58-1.22z"
          className={styles.heartGloss}
        />
      </svg>
    </button>
  )
}

