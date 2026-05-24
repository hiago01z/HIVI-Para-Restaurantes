/** Código de país padrão por moeda da aplicação */
export const DEFAULT_COUNTRY_CODE: Record<string, string> = {
  BRL: '55',
  EUR: '351',
}

/** Remove tudo exceto dígitos */
export function digitsOnly(v: string): string {
  return v.replace(/\D/g, '')
}

/**
 * Faz parse de um número armazenado (ex: "5511999999999")
 * retornando { code, local }.
 * Tenta os prefixos conhecidos do mais longo para o mais curto.
 */
export function parseStoredPhone(
  stored: string,
  defaultCode: string,
): { code: string; local: string } {
  if (!stored) return { code: defaultCode, local: '' }
  const known = ['351', '55', '44', '33', '49', '34', '39', '1']
  for (const code of known) {
    if (stored.startsWith(code)) {
      return { code, local: stored.slice(code.length) }
    }
  }
  return { code: defaultCode, local: stored }
}

/** Formata número local BR: (DDD) XXXXX-XXXX */
export function formatBrLocal(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Valida número local BR: DDD (2) + 8 ou 9 dígitos */
export function isBrLocalValid(local: string): boolean {
  const d = digitsOnly(local)
  return d.length === 10 || d.length === 11
}

/** Valida número local genérico: mínimo 6 dígitos */
export function isIntlLocalValid(local: string): boolean {
  return digitsOnly(local).length >= 6
}

/** Valida de acordo com o código de país */
export function isPhoneValid(code: string, local: string): boolean {
  return code === '55' ? isBrLocalValid(local) : isIntlLocalValid(local)
}

/** Monta o número completo para armazenamento (só dígitos, sem +) */
export function buildFullPhone(code: string, local: string): string {
  return `${digitsOnly(code)}${digitsOnly(local)}`
}
