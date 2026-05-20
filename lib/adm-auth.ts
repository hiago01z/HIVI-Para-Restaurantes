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

// ── Token ADM com payload completo (role + nome + memberId) ──
//
// Formato: base64url(JSON payload) + "." + hmacHex
// O payload carrega { slug, role, name, memberId, ts } para que
// o servidor possa aplicar restrições de RBAC sem precisar de
// uma consulta extra ao banco a cada request.

export interface AdmTokenPayload {
  slug: string
  role: string      // 'owner' | 'manager' | 'cook' | 'waiter' | 'delivery'
  name: string      // nome do membro (para "Alterado por …")
  memberId: string  // restaurant_users.id
  ts: number        // timestamp de criação (ms)
}

export async function createAdmToken(
  slug: string,
  role: string,
  name: string,
  memberId: string
): Promise<string> {
  const ts = Date.now()
  const payload: AdmTokenPayload = { slug, role, name, memberId, ts }
  const payloadStr = JSON.stringify(payload)
  // base64url (sem padding)
  const payloadB64 = btoa(payloadStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const sig = await hmacSign(payloadStr)
  return `${payloadB64}.${sig}`
}

export async function getAdmTokenPayload(
  slug: string,
  token: string
): Promise<AdmTokenPayload | null> {
  try {
    const dotIdx = token.lastIndexOf('.')
    // Token legado (formato antigo sem ".") — inválido, força novo login
    if (dotIdx === -1) return null

    const payloadB64 = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)

    // Restaura base64url → base64 padrão
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const valid = await hmacVerify(payloadStr, sig)
    if (!valid) return null

    const payload = JSON.parse(payloadStr) as AdmTokenPayload
    if (payload.slug !== slug) return null
    if (Date.now() - payload.ts > COOKIE_MAX_AGE * 1000) return null

    return payload
  } catch {
    return null
  }
}

export async function verifyAdmToken(slug: string, token: string): Promise<boolean> {
  return (await getAdmTokenPayload(slug, token)) !== null
}

export { COOKIE_MAX_AGE }
