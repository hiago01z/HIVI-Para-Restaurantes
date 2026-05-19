// ============================================================
// HIVI — Auth dedicada para o ADM do restaurante
// Usa apenas Web Crypto API (funciona em Edge + Node.js)
// Sem dependências externas
// ============================================================

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'hivi-adm-fallback'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 horas

// ── Utilitários ──────────────────────────────────────────────

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSign(message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return toHex(sig)
}

async function hmacVerify(message: string, sig: string): Promise<boolean> {
  const expected = await hmacSign(message)
  // Comparação em tempo constante (evita timing attacks)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  return diff === 0
}

// ── Hash de senha (PBKDF2) ───────────────────────────────────

export async function hashAdmPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = toHex(saltBytes.buffer)
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 },
    key,
    256
  )
  return `${salt}:${toHex(bits)}`
}

export async function verifyAdmPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, expectedHash] = stored.split(':')
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 },
      key,
      256
    )
    const hash = toHex(bits)
    // Comparação em tempo constante
    if (hash.length !== expectedHash.length) return false
    let diff = 0
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

// ── Cookie de sessão ADM ──────────────────────────────────────

export function admCookieName(slug: string): string {
  return `hivi_adm_${slug.replace(/-/g, '_')}`
}

export async function createAdmToken(slug: string): Promise<string> {
  const ts = Date.now().toString()
  const payload = `${slug}|${ts}`
  const sig = await hmacSign(payload)
  // safe base64url
  return btoa(`${payload}|${sig}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function verifyAdmToken(slug: string, token: string): Promise<boolean> {
  try {
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'))
    const firstPipe = decoded.indexOf('|')
    const secondPipe = decoded.indexOf('|', firstPipe + 1)
    if (firstPipe === -1 || secondPipe === -1) return false

    const tokenSlug = decoded.slice(0, firstPipe)
    const ts = decoded.slice(firstPipe + 1, secondPipe)
    const sig = decoded.slice(secondPipe + 1)

    if (tokenSlug !== slug) return false
    if (Date.now() - parseInt(ts) > COOKIE_MAX_AGE * 1000) return false

    const payload = `${tokenSlug}|${ts}`
    return await hmacVerify(payload, sig)
  } catch {
    return false
  }
}

export { COOKIE_MAX_AGE }
