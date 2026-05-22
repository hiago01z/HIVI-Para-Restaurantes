'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'

export type SelectedOption = {
  group_id: string
  group_name: string
  item_id: string
  item_name: string
  price_addition: number
}

export type CartItem = {
  id: string                        // product_id
  cartKey?: string                  // unique cart entry key: product_id or product_id__opt1_opt2
  name: string
  price: number                     // base product price
  quantity: number
  image_url?: string | null
  selectedOptions?: SelectedOption[]
}

/** Computes a unique cart key for product + options combo */
export function makeCartKey(productId: string, selectedOptions?: SelectedOption[]): string {
  if (!selectedOptions?.length) return productId
  const ids = [...selectedOptions]
    .sort((a, b) => a.item_id.localeCompare(b.item_id))
    .map((o) => o.item_id)
    .join('_')
  return `${productId}__${ids}`
}

type CartState = {
  items: CartItem[]
  slug: string
}

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; cartKey: string }
  | { type: 'INCREMENT'; cartKey: string }
  | { type: 'DECREMENT'; cartKey: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

function resolveKey(item: Pick<CartItem, 'id' | 'cartKey'>): string {
  return item.cartKey ?? item.id
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = resolveKey(action.item)
      const existing = state.items.find((i) => resolveKey(i) === key)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            resolveKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => resolveKey(i) !== action.cartKey) }
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          resolveKey(i) === action.cartKey ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map((i) => (resolveKey(i) === action.cartKey ? { ...i, quantity: i.quantity - 1 } : i))
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
  removeItem: (cartKey: string) => void
  increment: (cartKey: string) => void
  decrement: (cartKey: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], slug })

  // Load from localStorage on mount
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

  // Save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(`hivi-cart-${slug}`, JSON.stringify(state.items))
    } catch {
      // ignore
    }
  }, [state.items, slug])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD', item }), [])
  const removeItem = useCallback((cartKey: string) => dispatch({ type: 'REMOVE', cartKey }), [])
  const increment = useCallback((cartKey: string) => dispatch({ type: 'INCREMENT', cartKey }), [])
  const decrement = useCallback((cartKey: string) => dispatch({ type: 'DECREMENT', cartKey }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = state.items.reduce((sum, i) => {
    const extra = (i.selectedOptions ?? []).reduce((s, o) => s + o.price_addition, 0)
    return sum + (i.price + extra) * i.quantity
  }, 0)

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
