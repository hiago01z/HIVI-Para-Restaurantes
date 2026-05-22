/**
 * HIVI Thermal Printer — connection management
 *
 * Three connection types:
 *  - usb      : WebUSB API (Chrome desktop, USB cable) — zero install
 *  - bluetooth: Web Bluetooth API (Chrome) — zero install
 *  - browser  : OS print dialog via hidden iframe — zero install, any printer
 *
 * Module-level device references survive React re-renders but reset on
 * full page reload. USB/Bluetooth require reconnecting once per load.
 * Browser mode is always "connected" — no setup needed.
 */

import { encodeOrder, type PrintOrder } from './escpos'
import { buildReceiptHtml, printViaBrowser } from './receipt-html'

export type ConnectionType = 'usb' | 'bluetooth' | 'browser'

export interface PrinterConfig {
  type: ConnectionType
  autoPrint: boolean
  /** Characters per line — 32 for 58 mm, 48 for 80 mm */
  width: number
}

export const DEFAULT_CONFIG: PrinterConfig = {
  type: 'usb',
  autoPrint: true,
  width: 32,
}

const STORAGE_KEY = 'hivi_printer_config'

export function loadConfig(): PrinterConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PrinterConfig>
    // Migrate legacy 'network' type to 'browser'
    if ((parsed as { type?: string }).type === 'network') parsed.type = 'browser'
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

export function isUsbConnected(): boolean       { return _usbDevice !== null }
export function isBluetoothConnected(): boolean { return _btCharacteristic !== null }
export function isConnected(type: ConnectionType): boolean {
  if (type === 'usb')       return isUsbConnected()
  if (type === 'bluetooth') return isBluetoothConnected()
  return true // browser: no connection state — always ready
}

// ─── USB (WebUSB) ─────────────────────────────────────────────────────────────

export async function connectUsb(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any
  if (!nav.usb) {
    throw new Error('WebUSB não suportado. Use Chrome no computador.')
  }
  const device = await nav.usb.requestDevice({ filters: [{ classCode: 7 }] })
  await device.open()
  if (device.configuration === null) await device.selectConfiguration(1)
  const iface = device.configuration.interfaces[0]
  await device.claimInterface(iface.interfaceNumber)
  _usbDevice = device
}

export async function printUsb(data: Uint8Array): Promise<void> {
  if (!_usbDevice) {
    throw new Error('Impressora USB não conectada. Reconecte em Configurações.')
  }
  const iface = _usbDevice.configuration.interfaces[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ep = iface.alternate.endpoints.find((e: any) => e.direction === 'out')
  if (!ep) throw new Error('Endpoint de saída USB não encontrado.')

  const CHUNK = 512
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
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
]
const BLE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
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
      'Impressora encontrada mas serviço de impressão não identificado. Tente USB.'
    )
  }
}

export async function printBluetooth(data: Uint8Array): Promise<void> {
  if (!_btCharacteristic) {
    throw new Error('Impressora Bluetooth não conectada. Reconecte em Configurações.')
  }
  const CHUNK = 512
  for (let i = 0; i < data.byteLength; i += CHUNK) {
    await _btCharacteristic.writeValue(data.slice(i, i + CHUNK))
    await new Promise((r) => setTimeout(r, 20))
  }
}

export function disconnectBluetooth(): void {
  try { _btCharacteristic?.service?.device?.gatt?.disconnect() } catch { /* ignore */ }
  _btCharacteristic = null
}

// ─── Unified print ────────────────────────────────────────────────────────────

/**
 * Prints an order using whichever connection is configured.
 * Handles ESC/POS (USB/BT) and HTML receipt (browser) automatically.
 */
export async function printOrder(
  order: PrintOrder,
  config: PrinterConfig,
  restaurantName?: string,
): Promise<void> {
  if (config.type === 'browser') {
    const html = buildReceiptHtml(order, restaurantName, config.width)
    printViaBrowser(html)
    return
  }

  const bytes = encodeOrder(order, restaurantName, config.width)

  if (config.type === 'usb') {
    await printUsb(bytes)
  } else {
    await printBluetooth(bytes)
  }
}

/** Prints a test receipt */
export async function printTestOrder(config: PrinterConfig, restaurantName?: string): Promise<void> {
  const testOrder: PrintOrder = {
    order_number: 1,
    type: 'table',
    customer_name: 'Cliente Teste',
    table_number: '5',
    notes: 'Impressao de teste HIVI',
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
