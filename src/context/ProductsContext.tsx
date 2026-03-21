"use client";

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '../types'
import { fetchProducts } from '../api/products'

type ProductsState = {
  products: Product[]
  loading: boolean
  error: string | null
  retry: () => void
}

const ProductsContext = createContext<ProductsState | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: true,
    error: null,
    retry: () => {},
  })

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchProducts()
      .then((products) => setState({ products, loading: false, error: null, retry }))
      .catch((err) =>
        setState({
          products: [],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load products',
          retry,
        })
      )
  }, [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null, retry }))
    fetchProducts()
      .then((products) => {
        if (!cancelled) setState({ products, loading: false, error: null, retry })
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            products: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load products',
            retry,
          })
      })
    return () => {
      cancelled = true
    }
  }, [retry])

  return (
    <ProductsContext.Provider value={state}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts(): ProductsState {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
