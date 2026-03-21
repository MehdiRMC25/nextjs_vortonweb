"use client";

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { CartItem } from '../types'

type CartState = { items: CartItem[] }
type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string; variantIndex: number; size: string }
  | { type: 'UPDATE_QTY'; productId: string; variantIndex: number; size: string; quantity: number }
  | { type: 'CLEAR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(
        (i) =>
          i.product.id === action.item.product.id &&
          i.variantIndex === action.item.variantIndex &&
          i.size === action.item.size
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + action.item.quantity } : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return {
        items: state.items.filter(
          (i) =>
            !(
              i.product.id === action.productId &&
              i.variantIndex === action.variantIndex &&
              i.size === action.size
            )
        ),
      }
    case 'UPDATE_QTY':
      return {
        items: state.items
          .map((i) =>
            i.product.id === action.productId &&
            i.variantIndex === action.variantIndex &&
            i.size === action.size
              ? { ...i, quantity: action.quantity }
              : i
          )
          .filter((i) => i.quantity > 0),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

const CartContext = createContext<{
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantIndex: number, size: string) => void
  updateQuantity: (productId: string, variantIndex: number, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (item) => dispatch({ type: 'ADD', item }),
        removeItem: (productId, variantIndex, size) =>
          dispatch({ type: 'REMOVE', productId, variantIndex, size }),
        updateQuantity: (productId, variantIndex, size, quantity) =>
          dispatch({ type: 'UPDATE_QTY', productId, variantIndex, size, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
