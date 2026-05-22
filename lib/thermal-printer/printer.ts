/**
 * HIVI Thermal Printer — connection management
 *
 * Four connection types:
 *  - usb      : WebUSB API (Chrome desktop, USB cable) — zero install
 *  - bluetooth: Web Bluetooth API (Chrome) — zero install
 *  - network  : local TCP agent (hivi-print-agent.js) — bridges browser → port 9100
 *  - browser  : OS print dialog via hidden iframe — zero install, any printer
 *
 * Module-level device references survive React re-renders but reset on
 * full page reload. USB/Bluetooth require reconnecting once per load.
 * Browser mode is always "connected" — no setup needed.
 * Network mode requires the local agent to be running.
 */

import { encodeOrder, type PrintOrder, type CutMode, type Charset } from './escpos'
import { buildReceiptHtml, printViaBrowser } from './receipt-html'

export type ConnectionType = 'usb' | 'bluetooth' | 'browser' | 'network'

export interface PrinterConfig {
  type: ConnectionType
  autoPrint: boolean
  /** Characters per line — 32 for 58 mm, 48 for 80 mm */
  width: number
  /** TCP agent URL (network mode) */
  agentUrl?: string
  /** Paper cut mode */
  cutMode?: CutMode
  /** Character encoding */
  charset?: Charset
}

export const DEFAULT_AGENT_URL = 'http://localhost:6557'

export const DEFAULT_CONFIG: PrinterConfig = {
  type: 'browser', // safest default — works with any OS-configured printer, no WebUSB/BT needed
  autoPrint: true,
  width: 32,
  agentUrl: DEFAULT_AGENT_URL,
  cutMode: 'partial',
  charset: 'ascii',
}

const STORAGE_KEY = 'hivi_printer_config'

export function loadConfig(): PrinterConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PrinterConfig>
    // network is now a valid type again — no migration needed
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return null
  }
}

export function saveConfig(config: PrinterConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Module-level connection state (persists within browser session) ─────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _usbDevice: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _btCharacteristic: any = null
/** True when the BT characteristic supports writeWithoutResponse (Nordic UART, most budget printers) */
let _btWriteWithoutResponse = false

export function isUsbConnected(): boolean       { return _usbDevice !== null }
export function isBluetoothConnected(): boolean { return _btCharacteristic !== null }
export function isConnected(type: ConnectionType): boolean {
  if (type === 'usb')       return isUsbConnected()
  if (type === 'bluetooth') return isBluetoothConnected()
  return true // browser/network: no persistent connection state — report ready
}

// ─── USB (WebUSB) ─────────────────────────────────────────────────────────────

/** Finds the printer-class interface (class 7) or falls back to the first interface. */
/* eslint-disable @typescript-eslint/no-explicit-any */
function findPrinterInterface(device: any): any {
  return (
    device.configuration.interfaces.find((i: any) =>
      i.alternates.some((a: any) => a.interfaceClass === 7)
    ) ?? device.configuration.interfaces[0]
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function connectUsb(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any
  if (!nav.usb) {
    throw new Error('WebUSB não suportado. Use Chrome no computador.')
  }
  // classCode 7 = USB Printer Class; 0xFF = vendor-specific (many cheap thermal printers)
  const device = await nav.usb.requestDevice({
    filters: [{ classCode: 7 }, { classCode: 0xff }],
  })
  await device.open()
  if (device.configuration === null) await device.selectConfiguration(1)
  const iface = findPrinterInterface(device)
  await device.claimInterface(iface.interfaceNumber)
  _usbDevice = device
}

export async function printUsb(data: Uint8Array): Promise<void> {
  if (!_usbDevice) {
    throw new Error('Impressora USB não conectada. Reconecte em Configurações.')
  }
  const iface = findPrinterInterface(_usbDevice)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ep = iface.alternate.endpoints.find((e: any) => e.direction === 'out')
  if (!ep) throw new Error('Endpoint de saída USB não encontrado.')

  // Use the endpoint's own packetSize — Full-Speed USB (most thermal printers) uses 64 bytes
  const CHUNK = ep.packetSize ?? 64
  for (let i = 0; i < data.byteLength; i += CHUNK) {
    await _usbDevice.transferOut(ep.endpointNumber, data.slice(i, i + CHUNK))
  }
}

export function disconnectUsb(): void {
  try { _usbDevice?.close() } catch { /* ignore */ }
  _usbDevice = null
}

// ─── Bluetooth (Web Bluetooth) ────────────────────────────────────────────────

const BLE_SERVICES = [
  // Generic ESC/POS printers
  '000018f0-0000-1000-8000-00805f9b34fb',
  // SUNMI / Xprinter
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  // Peripage / many Chinese models
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  // Nordic UART (widely used in budget printers)
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
]
const BLE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  // Nordic UART TX (write)
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
]

export async function connectBluetooth(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any
  if (!nav.bluetooth) {
    throw new Error('Web Bluetooth não suportado. Use Chrome no Android ou computador com Bluetooth.')
  }
  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: BLE_SERVICES,
  })
  const server = await device.gatt.connect()

  let found = false
  for (const svcId of BLE_SERVICES) {
    if (found) break
    try {
      const service = await server.getPrimaryService(svcId)
      for (const charId of BLE_CHARACTERISTICS) {
        try {
          _btCharacteristic = await service.getCharacteristic(charId)
          found = true
          break
        } catch { /* try next */ }
      }
    } catch { /* try next */ }
  }

  if (!found) {
    throw new Error(
      'Impressora encontrada mas serviço de impressão não identificado. Tente USB ou Rede.'
    )
  }

  // Prefer writeWithoutResponse (Nordic UART / most budget printers) — avoids ACK waits
  _btWriteWithoutResponse = _btCharacteristic.properties?.writeWithoutResponse === true
}

export async function printBluetooth(data: Uint8Array): Promise<void> {
  if (!_btCharacteristic) {
    throw new Error('Impressora Bluetooth não conectada. Reconecte em Configurações.')
  }
  // 100-byte chunks + delay — BLE default MTU is 20 bytes; budget printers often skip MTU
  // negotiation, so 512-byte chunks overflow their buffer. 100 bytes is safe for all.
  const CHUNK = 100
  // writeWithoutResponse is fire-and-forget (faster); writeValue waits for ACK (slower but reliable)
  const DELAY = _btWriteWithoutResponse ? 20 : 60
  for (let i = 0; i < data.byteLength; i += CHUNK) {
    const slice = data.slice(i, i + CHUNK)
    if (_btWriteWithoutResponse) {
      await _btCharacteristic.writeValueWithoutResponse(slice)
    } else {
      await _btCharacteristic.writeValue(slice)
    }
    await new Promise((r) => setTimeout(r, DELAY))
  }
}

export function disconnectBluetooth(): void {
  try { _btCharacteristic?.service?.device?.gatt?.disconnect() } catch { /* ignore */ }
  _btCharacteristic = null
  _btWriteWithoutResponse = false
}

// ─── Network / TCP agent ──────────────────────────────────────────────────────

/**
 * Checks whether the local print agent is reachable.
 * Returns true if online, false if not responding.
 */
export async function checkNetworkAgent(agentUrl = DEFAULT_AGENT_URL): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${agentUrl}/status`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Sends raw ESC/POS bytes to the local TCP agent (hivi-print-agent.js).
 * The agent forwards them to the printer on port 9100 via TCP.
 */
export async function printNetwork(data: Uint8Array, agentUrl = DEFAULT_AGENT_URL): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${agentUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw new Error(`Agente retornou erro: ${msg}`)
    }
  } catch (e) {
    clearTimeout(timeout)
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Agente de impressão não respondeu. Verifique se está rodando.')
    }
    throw e
  }
}

// ─── Unified print ────────────────────────────────────────────────────────────

/**
 * Prints an order using whichever connection is configured.
 * Handles ESC/POS (USB/BT/network) and HTML receipt (browser) automatically.
 */
export async function printOrder(
  order: PrintOrder,
  config: PrinterConfig,
  restaurantName?: string,
): Promise<void> {
  const cutMode = config.cutMode ?? 'partial'
  const charset = config.charset ?? 'ascii'

  if (config.type === 'browser') {
    const html = buildReceiptHtml(order, restaurantName, config.width)
    printViaBrowser(html)
    return
  }

  const bytes = encodeOrder(order, restaurantName, config.width, cutMode, charset)

  if (config.type === 'usb') {
    await printUsb(bytes)
  } else if (config.type === 'network') {
    await printNetwork(bytes, config.agentUrl ?? DEFAULT_AGENT_URL)
  } else {
    await printBluetooth(bytes)
  }
}

/** Prints a test receipt */
export async function printTestOrder(config: PrinterConfig, restaurantName?: string): Promise<void> {
  const testOrder: PrintOrder = {
    order_number: 1,
    type: 'delivery',
    customer_name: 'Cliente Teste',
    table_number: null,
    address: 'Rua Exemplo, 123',
    customer_phone: '5595999990000',
    payment_method: 'dinheiro',
    change_for: 50,
    notes: config.charset === 'latin1'
      ? 'Impressão de teste HIVI — ã ç é á'
      : 'Impressao de teste HIVI',
    total: 45.50,
    created_at: new Date().toISOString(),
    order_items: [
      {
        product_name: 'Item de Teste',
        product_price: 32.50,
        quantity: 1,
        selected_options: [{ group_name: 'Adicional', item_name: 'Queijo extra', price_addition: 3.00 }],
      },
      { product_name: 'Bebida', product_price: 5.00, quantity: 2 },
    ],
  }
  await printOrder(testOrder, config, restaurantName)
}
