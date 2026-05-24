'use client'

import { createContext, useContext } from 'react'
import type { SupportedCurrency } from '@/lib/currency'
import { formatCurrency } from '@/lib/currency'

const CurrencyContext = createContext<SupportedCurrency>('BRL')

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: SupportedCurrency
  children: React.ReactNode
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

/** Retorna a moeda do restaurante atual (BRL ou EUR) */
export function useCurrency(): SupportedCurrency {
  return useContext(CurrencyContext)
}

/** Atalho: formata um valor já com a moeda do contexto */
export function useFormatPrice() {
  const currency = useCurrency()
  return (value: number) => formatCurrency(value, currency)
}
