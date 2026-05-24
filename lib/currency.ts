/**
 * HIVI — Utilitário de moeda
 * Suporta BRL (Brasil) e EUR (Portugal)
 */

export type SupportedCurrency = 'BRL' | 'EUR'

const LOCALE_MAP: Record<SupportedCurrency, string> = {
  BRL: 'pt-BR',
  EUR: 'pt-PT',
}

/**
 * Formata um valor numérico na moeda correta.
 * BRL → "R$ 12,90"   (locale pt-BR)
 * EUR → "12,90 €"    (locale pt-PT, símbolo após o valor)
 */
export function formatCurrency(
  value: number,
  currency: SupportedCurrency = 'BRL',
): string {
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  BRL: 'Real brasileiro (R$)',
  EUR: 'Euro (€)',
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  BRL: 'R$',
  EUR: '€',
}
