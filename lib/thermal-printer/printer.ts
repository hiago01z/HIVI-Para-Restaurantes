/**
 * HIVI Thermal Printer — connection management
 *
 * Supports three connection types:
 *  - USB  : WebUSB API (Chrome desktop, USB cable)
 *  - BT   : Web Bluetooth API (Chrome, Bluetooth)
 *  - Network: HTTP POST to a local print agent (hivi-print-agent.js)
 *
 * Module-level device references survive React re-renders but are reset
 * on full page reload. For USB/Bluetooth, the user must reconnect once
 * after each page load.
 */

export type ConnectionType = 'usb' | 'bluetooth' | 'network'

export interface PrinterConfig {
  type: ConnectionType
  networkUrl: string
  autoPrint: boolean
  /** Characters per line — 32 for 58 mm, 48 for 80 mm */
  width: number
}

export const DEFAULT_CONFIG: PrinterConfig = {
  type: 'usb',
  networkUrl: 'http://localhost:6557',
  autoPrint: true,
  width: 32,
}

const STORAGE_KEY = 'hivi_printer_config'

export function loadConfig(): PrinterConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : null
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

// ─── Module-level state (persists within browser session) ────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _usbDevice: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _btCharacteristic: any = null

export function isUsbConnected(): boolean  { return _usbDevice !== null }
export function isBluetoothConnected(): boolean { return _btCharacteristic !== null }
export function isConnected(type: ConnectionType): boolean {
  if (type === 'usb')       return isUsbConnected()
  if (type === 'bluetooth') return isBluetoothConnected()
  return true // network: connection is stateless HTTP
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

// Common BLE service/characteristic UUIDs for thermal printers
const BLE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // common Chinese printers
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Postek, newer models
  '0000ff00-0000-1000-8000-00805f9b34fb', // some Zjiang models
  '0000ffe0-0000-1000-8000-00805f9b34fb', // some small BT printers
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
        } catch { /* try next characteristic */ }
      }
    } catch { /* try next service */ }
  }

  if (!found) {
    throw new Error(
      'Impressora encontrada mas serviço de impressão não identificado. Tente outro modelo ou use USB.'
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
    await new Promise((r) => setTimeout(r, 20)) // small delay between chunks
  }
}

export function disconnectBluetooth(): void {
  try {
    _btCharacteristic?.service?.device?.gatt?.disconnect()
  } catch { /* ignore */ }
  _btCharacteristic = null
}

// ─── Network (local print agent) ─────────────────────────────────────────────

export async function printNetwork(
  data: Uint8Array,
  agentUrl = 'http://localhost:6557',
): Promise<void> {
  const res = await fetch(`${agentUrl}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: data as unknown as any,
  })
  if (!res.ok) {
    throw new Error(`Agente retornou ${res.status}. Verifique se hivi-print-agent.js está rodando.`)
  }
}

export async function pingNetworkAgent(agentUrl = 'http://localhost:6557'): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${agentUrl}/status`, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

// ─── Unified print ────────────────────────────────────────────────────────────

export async function printData(data: Uint8Array, config: PrinterConfig): Promise<void> {
  switch (config.type) {
    case 'usb':       return printUsb(data)
    case 'bluetooth': return printBluetooth(data)
    case 'network':   return printNetwork(data, config.networkUrl)
  }
}
