// ============================================================
// HIVI — Rate Limiter simples em memória
// Sliding window, sem dependências externas
// Funciona por instância (serverless — protege contra bursts)
// ============================================================

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Limpa entradas expiradas a cada 10 min para evitar vazamento de memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

/**
 * Verifica se a chave está dentro do limite.
 * @param key      Identificador (ex: "ip:orders:1.2.3.4")
 * @param limit    Máximo de requisições na janela
 * @param windowMs Duração da janela em ms
 * @returns true = permitido | false = bloqueado
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/**
 * Extrai o IP do cliente, respeitando proxies (Vercel, Cloudflare).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}
