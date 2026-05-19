'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

type CartState = {
  items: CartItem[]
  slug: string
}

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; id: string }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'LOAD':
      return { ...state, items: action.items }
    default:
      return state
  }
}

type CartContextValue = {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], slug })

  // Carregar do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`hivi-cart-${slug}`)
      if (stored) {
        const items: CartItem[] = JSON.parse(stored)
        dispatch({ type: 'LOAD', items })
      }
    } catch {
      // ignore
    }
  }, [slug])

  // Salvar no localStorage a cada mudança
  useEffect(() => {
    try {
      localStorage.setItem(`hivi-cart-${slug}`, JSON.stringify(state.items))
    } catch {
      // ignore
    }
  }, [state.items, slug])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD', item }), [])
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), [])
  const increment = useCallback((id: string) => dispatch({ type: 'INCREMENT', id }), [])
  const decrement = useCallback((id: string) => dispatch({ type: 'DECREMENT', id }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items: state.items, totalItems, totalPrice, addItem, removeItem, increment, decrement, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
