/**
 * HIVI — Gerador de PIX BR Code (EMV QR Code)
 * Padrão Banco Central do Brasil — sem dependências externas
 * https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp'

// ─── CRC16-CCITT ─────────────────────────────────────────────────────────────

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      // Máscara 0xffff obrigatória a cada iteração — JS usa 32 bits internamente
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// ─── Campo EMV: ID (2 chars) + Length (2 digits) + Value ─────────────────────

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

// ─── Gerador de payload ───────────────────────────────────────────────────────

export interface PixPayloadOptions {
  key: string
  merchantName: string
  merchantCity?: string
  amount?: number        // undefined = sem valor fixo
  txid?: string          // referência do pedido (max 25 chars)
  description?: string   // info adicional (max 72 chars)
}

export function generatePixPayload({
  key,
  merchantName,
  merchantCity = 'Brasil',
  amount,
  txid,
  description,
}: PixPayloadOptions): string {
  // Sanitiza strings (remove caracteres especiais não permitidos)
  const sanitize = (s: string, max: number) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, max)

  const name = sanitize(merchantName, 25) || 'Restaurante'
  const city = sanitize(merchantCity, 15) || 'Brasil'

  // Merchant Account Info (ID 26)
  const gui  = field('00', 'BR.GOV.BCB.PIX')
  const pkey = field('01', key)
  const desc = description ? field('02', description.substring(0, 72)) : ''
  const mai  = field('26', gui + pkey + desc)

  // Additional Data Field Template (ID 62)
  const ref = txid ? txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) : '***'
  const adf = field('62', field('05', ref))

  // Monta payload sem CRC
  const payload =
    field('00', '01') +                              // Payload Format Indicator
    field('01', '11') +                              // Point of Initiation (11 = QR estático reutilizável)
    mai +                                             // Merchant Account Info
    field('52', '0000') +                            // Merchant Category Code
    field('53', '986') +                             // Transaction Currency (BRL)
    (amount != null ? field('54', amount.toFixed(2)) : '') +
    field('58', 'BR') +                              // Country Code
    field('59', name) +                              // Merchant Name
    field('60', city) +                              // Merchant City
    adf +                                             // Additional Data
    '6304'                                            // CRC placeholder

  return payload + crc16(payload)
}

// ─── Validações por tipo de chave ─────────────────────────────────────────────

const VALIDATORS: Record<PixKeyType, (v: string) => boolean> = {
  cpf:   (v) => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v.trim()) && v.replace(/\D/g, '').length === 11,
  cnpj:  (v) => /^\d{2}\.?\d{3}\.?\d{3}\/?\.?\d{4}-?\d{2}$/.test(v.trim()) && v.replace(/\D/g, '').length === 14,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  phone: (v) => /^(\+55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.trim()),
  evp:   (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()),
}

export function validatePixKey(type: PixKeyType, value: string): boolean {
  return VALIDATORS[type]?.(value) ?? false
}

/** Normaliza a chave para o formato esperado pelo Banco Central */
export function normalizePixKey(type: PixKeyType, value: string): string {
  const v = value.trim()
  if (type === 'cpf')   return v.replace(/\D/g, '')
  if (type === 'cnpj')  return v.replace(/\D/g, '')
  if (type === 'phone') {
    const digits = v.replace(/\D/g, '')
    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`
  }
  return v.toLowerCase()
}

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  cpf:   'CPF',
  cnpj:  'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  evp:   'Chave aleatória',
}

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  cpf:   '000.000.000-00',
  cnpj:  '00.000.000/0001-00',
  email: 'contato@restaurante.com.br',
  phone: '+55 11 99999-9999',
  evp:   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
}
