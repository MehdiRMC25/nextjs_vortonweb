'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadFavorites, saveFavorites, type FavoriteKey } from '@/lib/favorites'

type FavoritesState = {
  favoritesSet: Set<FavoriteKey>
  add: (key: FavoriteKey) => void
  remove: (key: FavoriteKey) => void
  removeMany: (keys: Iterable<FavoriteKey>) => void
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

  const add = useCallback((key: FavoriteKey) => {
    const k = String(key ?? '').trim()
    if (!k) return
    setFavoritesSet((prev) => {
      if (prev.has(k)) return prev
      const next = new Set(prev)
      next.add(k)
      saveFavorites(next)
      return next
    })
  }, [])

  const remove = useCallback((key: FavoriteKey) => {
    const k = String(key ?? '').trim()
    if (!k) return
    setFavoritesSet((prev) => {
      if (!prev.has(k)) return prev
      const next = new Set(prev)
      next.delete(k)
      saveFavorites(next)
      return next
    })
  }, [])

  const removeMany = useCallback((keys: Iterable<FavoriteKey>) => {
    const list = Array.from(keys).map((k) => String(k ?? '').trim()).filter(Boolean)
    if (list.length === 0) return
    setFavoritesSet((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const k of list) {
        if (next.delete(k)) changed = true
      }
      if (!changed) return prev
      saveFavorites(next)
      return next
    })
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
      add,
      remove,
      removeMany,
      toggle,
      isFavorite,
      count: favoritesSet.size,
    }
  }, [favoritesSet, add, remove, removeMany, toggle, isFavorite])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesState {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

