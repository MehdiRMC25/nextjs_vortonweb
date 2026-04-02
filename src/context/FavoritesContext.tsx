'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadFavorites, saveFavorites, type FavoriteKey } from '@/lib/favorites'

type FavoritesState = {
  favoritesSet: Set<FavoriteKey>
  toggle: (key: FavoriteKey) => void
  isFavorite: (key: FavoriteKey) => boolean
  count: number
}

const FavoritesContext = createContext<FavoritesState | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoritesSet, setFavoritesSet] = useState<Set<FavoriteKey>>(() => new Set())

  useEffect(() => {
    setFavoritesSet(loadFavorites())
  }, [])

  const toggle = useCallback((key: FavoriteKey) => {
    const k = String(key ?? '').trim()
    if (!k) return
    setFavoritesSet((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((key: FavoriteKey) => favoritesSet.has(String(key ?? '').trim()), [favoritesSet])

  const value = useMemo<FavoritesState>(() => {
    return {
      favoritesSet,
      toggle,
      isFavorite,
      count: favoritesSet.size,
    }
  }, [favoritesSet, toggle, isFavorite])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

