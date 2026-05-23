'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, ChevronDown, ChevronUp, X, Loader2, QrCode, UserCheck } from 'lucide-react'
import {
  loadConfig,
  connectUsb,
  connectBluetooth,
  printOrder as printerPrintOrder,
  isConnected,
  type PrinterConfig,
} from '@/lib/thermal-printer/printer'
import type { PrintOrder } from '@/lib/thermal-printer/escpos'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrScanner } from '../_components/qr-scanner'
import { QRCodeSVG } from 'qrcode.react'
import { generatePixPayload, type PixKeyType } from '@/lib/pix'

type SelectedOption = {
  group_id: string
  group_name: string
  item_id: string
  item_name: string
  price_addition: number
}

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
  selected_options?: SelectedOption[] | null
}

type Order = {
  id: string
  order_number: number
  type: 'table' | 'delivery'
  status: string
  status_changed_by: string | null
  customer_name: string | null
  customer_phone: string | null
  address: string | null
  table_number: string | null
  payment_method: string | null
  change_for: number | null
  notes: string | null
  payment_status: 'paid' | 'unpaid'
  payment_changed_by: string | null
  total: number
  created_at: string
  order_items: OrderItem[]
}

// ── Status disponíveis e quais cargos podem selecionar cada um ──

const STATUS_OPTIONS = [
  { value: 'pending',          label: 'Aguardando',       color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed',        label: 'Confirmado',        color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing',        label: 'Sendo preparado',   color: 'bg-purple-100 text-purple-800' },
  { value: 'ready',            label: 'Pronto',            color: 'bg-green-100 text-green-800' },
  { value: 'out_for_delivery', label: 'Saiu p/ entrega',   color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered',        label: 'Entregue',          color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled',        label: 'Cancelado',         color: 'bg-red-100 text-red-800' },
]

// Quais status cada cargo pode SELECIONAR no modal
const STATUS_ALLOWED: Record<string, string[]> = {
  owner:    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
  manager:  ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
  cook:     ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'],
  waiter:   ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'cancelled'],
  delivery: ['out_for_delivery', 'delivered', 'cancelled'],
}

// Quais abas cada cargo pode ver
const TAB_ALLOWED: Record<string, string[]> = {
  owner:    ['delivery', 'table', 'qr'],
  manager:  ['delivery', 'table', 'qr'],
  cook:     ['delivery', 'table'],
  waiter:   ['delivery', 'table', 'qr'],
  delivery: ['delivery'],
}

function getStatusConfig(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type Periodo = 'hoje' | 'ontem' | '7dias'

type Props = {
  restaurantId: string
  restaurantName: string
  pixKey: string | null
  pixKeyType: string | null
  initialOrders: Order[]
  isToday: boolean
  slug: string
  activePeriodo: Periodo
  memberRole: string
  memberName: string
}

const PERIODO_FILTERS: { label: string; value: Periodo; href: (slug: string) => string }[] = [
  { label: 'Hoje',   value: 'hoje',  href: (s) => `/${s}/adm/pedidos` },
  { label: 'Ontem',  value: 'ontem', href: (s) => `/${s}/adm/pedidos?periodo=ontem` },
  { label: '7 dias', value: '7dias', href: (s) => `/${s}/adm/pedidos?periodo=7dias` },
]

const PERIODO_LABEL: Record<Periodo, string> = {
  'hoje':  'Pedidos de hoje',
  'ontem': 'Pedidos de ontem',
  '7dias': 'Pedidos dos últimos 7 dias',
}

export function PedidosClient({
  restaurantId, restaurantName, pixKey, pixKeyType, initialOrders, isToday, slug, activePeriodo, memberRole, memberName,
}: Props) {
  const router = useRouter()
  const allowedTabs = TAB_ALLOWED[memberRole] ?? ['delivery', 'table', 'qr']
  const allowedStatuses = STATUS_ALLOWED[memberRole] ?? STATUS_OPTIONS.map((s) => s.value)

  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [tab, setTab] = useState<string>(allowedTabs[0] ?? 'delivery')

  // Modal QR Code PIX
  const [pixModal, setPixModal] = useState<{ order: Order; payload: string } | null>(null)
  const [pixCopied, setPixCopied] = useState(false)

  function openPixModal(order: Order) {
    if (!pixKey) return
    const payload = generatePixPayload({
      key: pixKey,
      merchantName: restaurantName,
      amount: order.total,
      txid: `HIVI${order.order_number}`,
      description: `Pedido #${order.order_number}`,
    })
    setPixModal({ order, payload })
    setPixCopied(false)
  }

  async function copyPix(text: string) {
    await navigator.clipboard.writeText(text)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2000)
  }
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // ── Som de notificação ─────────────────────────────────────────────────────
  // soundOnRef é lido dentro de callbacks do Realtime (closures antigas).
  // useState controla apenas o visual do botão.
  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef  = useRef(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // ── Impressora térmica ─────────────────────────────────────────────────────
  const printerConfigRef  = useRef<PrinterConfig | null>(null)
  const autoPrintRef      = useRef(true)
  const [printerConfigured, setPrinterConfigured] = useState(false)
  const [printerConnected, setPrinterConnected]   = useState(false)
  const [autoPrintOn, setAutoPrintOn]             = useState(true)
  const [reconnecting, setReconnecting]           = useState(false)
  const [printingId, setPrintingId]               = useState<string | null>(null)
  const [printToast, setPrintToast]               = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const cfg = loadConfig()
    if (!cfg) return
    printerConfigRef.current = cfg
    autoPrintRef.current = cfg.autoPrint
    setAutoPrintOn(cfg.autoPrint)
    setPrinterConfigured(true)
    // browser mode is always connected; usb/bt depend on device pairing state
    setPrinterConnected(cfg.type === 'browser' ? true : isConnected(cfg.type))
  }, [])

  function showPrintToast(ok: boolean, msg: string) {
    setPrintToast({ ok, msg })
    setTimeout(() => setPrintToast(null), 4000)
  }

  async function handleReconnectPrinter() {
    const cfg = printerConfigRef.current
    if (!cfg || cfg.type === 'browser') return
    setReconnecting(true)
    try {
      if (cfg.type === 'usb') await connectUsb()
      else await connectBluetooth()
      setPrinterConnected(true)
    } catch (e) {
      showPrintToast(false, e instanceof Error ? e.message : 'Erro ao conectar impressora.')
    } finally {
      setReconnecting(false)
    }
  }

  function toggleAutoPrint() {
    const next = !autoPrintRef.current
    autoPrintRef.current = next
    setAutoPrintOn(next)
    const cfg = printerConfigRef.current
    if (cfg) {
      const updated = { ...cfg, autoPrint: next }
      printerConfigRef.current = updated
      import('@/lib/thermal-printer/printer').then(({ saveConfig }) => saveConfig(updated))
    }
  }

  async function doPrint(order: Order) {
    const cfg = printerConfigRef.current
    if (!cfg) return
    await printerPrintOrder(order as unknown as PrintOrder, cfg, restaurantName)
  }

  async function handleAutoPrint(order: Order) {
    if (!autoPrintRef.current || !printerConfigRef.current) return
    const cfg = printerConfigRef.current
    if (cfg.type !== 'browser' && !isConnected(cfg.type)) return
    try {
      await doPrint(order)
    } catch (e) {
      showPrintToast(false, e instanceof Error ? e.message : 'Falha na auto-impressão.')
    }
  }

  async function handleManualPrint(order: Order) {
    if (!printerConfigRef.current) return
    setPrintingId(order.id)
    try {
      await doPrint(order)
      showPrintToast(true, `Pedido #${order.order_number} enviado para impressora.`)
    } catch (e) {
      showPrintToast(false, e instanceof Error ? e.message : 'Erro ao imprimir.')
    } finally {
      setPrintingId(null)
    }
  }

  // Desbloqueia o AudioContext no primeiro gesto do usuário na página
  useEffect(() => {
    function unlock() {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
      document.removeEventListener('click',      unlock)
      document.removeEventListener('touchstart', unlock)
    }
    document.addEventListener('click',      unlock)
    document.addEventListener('touchstart', unlock)
    return () => {
      document.removeEventListener('click',      unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  function playBeeps(ctx: AudioContext) {
    ;[[880, 0, 0.15], [1100, 0.2, 0.15]].forEach(([freq, start, duration]) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq as number
      osc.type = 'sine'
      gain.gain.setValueAtTime(1.0, ctx.currentTime + (start as number))
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (start as number) + (duration as number))
      osc.start(ctx.currentTime + (start as number))
      osc.stop(ctx.currentTime + (start as number) + (duration as number))
    })
  }

  function toggleSound() {
    try {
      if (soundOnRef.current) {
        soundOnRef.current = false
        setSoundOn(false)
        return
      }
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      ctx.resume().then(() => {
        playBeeps(ctx)          // beep de confirmação ao ativar
        soundOnRef.current = true
        setSoundOn(true)
      })
    } catch {
      // ignore
    }
  }

  function playNewOrderSound() {
    // Usa ref — não sofre de stale closure nas callbacks do Realtime
    if (!soundOnRef.current || !audioCtxRef.current) return
    try {
      audioCtxRef.current.resume().then(() => playBeeps(audioCtxRef.current!))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!isToday) return

    const channel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('orders')
            .select(`
              id, order_number, type, status, status_changed_by, customer_name, customer_phone,
              address, table_number, payment_method, change_for, notes, payment_status, payment_changed_by, total, created_at,
              order_items (id, product_name, product_price, quantity, selected_options)
            `)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setOrders((prev) => [data as Order, ...prev])
            playNewOrderSound()
            handleAutoPrint(data as Order)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, isToday])

  async function handleStatusChange() {
    if (!editingOrder || !newStatus) return
    setStatusLoading(true)
    setStatusError('')
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === editingOrder.id
            ? { ...o, status: newStatus, status_changed_by: memberName || null }
            : o
          )
        )
        setEditingOrder(null)
      } else {
        const data = await res.json().catch(() => ({}))
        setStatusError(data.error ?? 'Erro ao atualizar status. Tente novamente.')
      }
    } catch {
      setStatusError('Erro de conexão. Tente novamente.')
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleTogglePayment(order: Order) {
    const next = order.payment_status === 'paid' ? 'unpaid' : 'paid'
    setPaymentLoadingId(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: next }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === order.id
            ? { ...o, payment_status: next, payment_changed_by: memberName || null }
            : o
          )
        )
      }
    } catch {
      // falha silenciosa — o badge volta ao estado anterior naturalmente
    } finally {
      setPaymentLoadingId(null)
    }
  }

  const handleQrDetect = useCallback((url: string) => {
    try {
      const parsed = new URL(url)
      router.push(parsed.pathname)
    } catch {
      if (url.startsWith('/')) {
        router.push(url)
      } else {
        router.push(`/${url}`)
      }
    }
  }, [router])

  const deliveryOrders = orders.filter((o) => o.type === 'delivery')
  const tableOrders = orders.filter((o) => o.type === 'table')

  const ALL_TABS = [
    { key: 'delivery', label: 'Entrega',      count: deliveryOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length },
    { key: 'table',    label: 'Mesa',          count: tableOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length },
    { key: 'qr',       label: 'Ler QR Code',   count: 0 },
  ]

  const tabs = ALL_TABS.filter((t) => allowedTabs.includes(t.key))

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{PERIODO_LABEL[activePeriodo]}</h1>
        <div className="flex items-center gap-2">
          {/* Printer toggle — only shown when printer is configured */}
          {printerConfigured && (
            <button
              onClick={autoPrintOn ? toggleAutoPrint : handleReconnectPrinter}
              disabled={reconnecting}
              title={
                !printerConnected && printerConfigRef.current?.type !== 'browser'
                  ? 'Clique para reconectar a impressora'
                  : autoPrintOn ? 'Auto-impressão ativa' : 'Auto-impressão pausada'
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={
                reconnecting
                  ? { background: '#f3f4f6', color: '#9ca3af' }
                  : printerConnected && autoPrintOn
                  ? { background: 'color-mix(in srgb, var(--adm-primary) 12%, white)', color: 'var(--adm-primary)' }
                  : { background: '#fef3c7', color: '#b45309' }
              }
            >
              {reconnecting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Printer className="w-3.5 h-3.5" />
              }
              {reconnecting
                ? 'Conectando...'
                : printerConnected
                ? (autoPrintOn ? 'Impr. ativa' : 'Impr. pausada')
                : 'Reconectar'
              }
            </button>
          )}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Desativar som de notificação' : 'Ativar som de notificação'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            style={soundOn
              ? { background: 'color-mix(in srgb, var(--adm-primary) 12%, white)', color: 'var(--adm-primary)' }
              : { background: '#f3f4f6', color: '#9ca3af' }
            }
          >
            {soundOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {soundOn ? 'Som ativo' : 'Som'}
          </button>
        </div>
      </div>

      {/* Print toast */}
      {printToast && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mb-3 transition-all"
          style={printToast.ok
            ? { background: '#dcfce7', color: '#15803d' }
            : { background: '#fee2e2', color: '#b91c1c' }
          }
        >
          <Printer className="w-4 h-4 flex-shrink-0" />
          {printToast.msg}
        </div>
      )}

      {/* Filtro de período */}
      <div className="flex gap-1.5 mb-5">
        {PERIODO_FILTERS.map((f) => {
          const isActive = activePeriodo === f.value
          return (
            <Link
              key={f.value}
              href={f.href(slug)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={isActive
                ? { background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }
                : { background: '#f3f4f6', color: '#6b7280' }
              }
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Tabs (filtradas por cargo) */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.key === 'qr' && <QrCode className="w-4 h-4" />}
            {t.label}
            {t.count > 0 && (
              <span className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba Ler QR Code */}
      {tab === 'qr' && (
        <QrScanner onDetect={handleQrDetect} />
      )}

      {/* Lista de pedidos */}
      {tab !== 'qr' && (
        <div className="space-y-3">
          {(tab === 'delivery' ? deliveryOrders : tableOrders).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400 text-sm">
                {`Nenhum pedido de ${tab === 'delivery' ? 'entrega' : 'mesa'} ${
                  activePeriodo === 'hoje' ? 'hoje' :
                  activePeriodo === 'ontem' ? 'ontem' :
                  'nos últimos 7 dias'
                }.`}
              </p>
            </div>
          ) : (
            (tab === 'delivery' ? deliveryOrders : tableOrders).map((order) => {
              const sc = getStatusConfig(order.status)
              const expanded = expandedId === order.id

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-gray-900 text-base">#{order.order_number}</span>
                          {order.customer_name && (
                            <span className="text-gray-600 text-sm">— {order.customer_name}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatTime(order.created_at)}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Status + botão editar */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.color}`}>
                              {sc.label}
                            </span>
                            {/* "Alterado por" — audit trail */}
                            {order.status_changed_by && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <UserCheck className="w-3 h-3" />
                                {order.status_changed_by}
                              </span>
                            )}
                          </div>
                          {printerConfigured && (
                            <button
                              onClick={() => handleManualPrint(order)}
                              disabled={printingId === order.id}
                              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-50"
                              title="Imprimir pedido"
                            >
                              {printingId === order.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Printer className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingOrder(order); setNewStatus(order.status) }}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                            title="Alterar status"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Status de pagamento */}
                        <div className="flex flex-col items-end gap-0.5">
                          <button
                            onClick={() => handleTogglePayment(order)}
                            disabled={paymentLoadingId === order.id}
                            className="text-xs font-bold px-2.5 py-1 rounded-full transition-colors disabled:opacity-60"
                            style={order.payment_status === 'paid'
                              ? { background: '#dcfce7', color: '#15803d' }
                              : { background: '#fee2e2', color: '#b91c1c' }
                            }
                          >
                            {paymentLoadingId === order.id
                              ? '...'
                              : order.payment_status === 'paid' ? '✓ Pago' : '✗ Não pago'
                            }
                          </button>
                          {order.payment_changed_by && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <UserCheck className="w-3 h-3" />
                              {order.payment_changed_by}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info do pedido */}
                    {order.type === 'delivery' && (
                      <div className="space-y-1 text-sm">
                        {order.address && (
                          <p className="text-gray-600 text-xs"><span className="font-medium">Endereço:</span> {order.address}</p>
                        )}
                        {order.customer_phone && (
                          <p className="text-gray-600 text-xs"><span className="font-medium">WhatsApp:</span> {order.customer_phone}</p>
                        )}
                        {order.payment_method && (
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">Pagamento:</span> {order.payment_method}
                            {order.change_for && ` (troco p/ ${formatPrice(order.change_for)})`}
                          </p>
                        )}
                        {order.payment_method === 'pix' && pixKey && (
                          <button
                            onClick={() => openPixModal(order)}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-green-700 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Gerar QR Code PIX
                          </button>
                        )}
                        {order.payment_method === 'pix' && !pixKey && (
                          <p className="text-xs text-amber-600 mt-1">⚠️ Configure a chave PIX em Configurações para gerar QR code.</p>
                        )}
                      </div>
                    )}

                    {order.type === 'table' && order.table_number && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Mesa:</span> {order.table_number}</p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                        💬 {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Toggle itens */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-500">
                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'} — {formatPrice(order.total)}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {expanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      {order.order_items.map((item) => {
                        const optionsExtra = (item.selected_options ?? []).reduce((s, o) => s + o.price_addition, 0)
                        return (
                        <div key={item.id} className="py-1.5">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-700">
                              <span className="font-bold" style={{ color: 'var(--adm-primary)' }}>{item.quantity}x</span> {item.product_name}
                            </span>
                            <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{formatPrice((item.product_price + optionsExtra) * item.quantity)}</span>
                          </div>
                          {item.selected_options && item.selected_options.length > 0 && (
                            <div className="mt-0.5 pl-5 space-y-0.5">
                              {item.selected_options.map((o) => (
                                <p key={o.item_id} className="text-xs text-gray-400">
                                  {o.group_name}: <span className="font-medium text-gray-600">{o.item_name}</span>
                                  {o.price_addition > 0 && <span className="text-gray-400"> (+{formatPrice(o.price_addition)})</span>}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        )
                      })}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black text-gray-900 text-sm">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal alterar status */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">Alterar status</h3>
              <button onClick={() => { setEditingOrder(null); setStatusError('') }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Pedido #{editingOrder.order_number}</p>
            {statusError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">{statusError}</p>
            )}

            <div className="space-y-2 mb-6">
              {STATUS_OPTIONS
                .filter((s) => editingOrder.type === 'delivery' || s.value !== 'out_for_delivery')
                .map((s) => {
                  const isAllowed = allowedStatuses.includes(s.value)
                  const isSelected = newStatus === s.value

                  return (
                    <button
                      key={s.value}
                      onClick={() => isAllowed && setNewStatus(s.value)}
                      disabled={!isAllowed}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                        !isAllowed
                          ? 'border-gray-50 bg-gray-50 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? ''
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                      style={isAllowed && isSelected ? {
                        borderColor: 'var(--adm-primary)',
                        background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                      } : undefined}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color.replace('text-', 'bg-').split(' ')[0]}`} />
                      <span
                        className="text-sm font-medium"
                        style={isAllowed && isSelected ? { color: 'var(--adm-primary)' } : { color: '#374151' }}
                      >
                        {s.label}
                      </span>
                      {!isAllowed && (
                        <span className="ml-auto text-xs text-gray-400">sem permissão</span>
                      )}
                    </button>
                  )
                })}
            </div>

            <button
              onClick={handleStatusChange}
              disabled={statusLoading || newStatus === editingOrder.status || !allowedStatuses.includes(newStatus)}
              className="w-full py-3.5 disabled:opacity-50 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
            >
              {statusLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {statusLoading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal QR Code PIX ── */}
      {pixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPixModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-900 mb-0.5">QR Code PIX</p>
            <p className="text-xs text-gray-500 mb-4">
              Pedido <strong>#{pixModal.order.order_number}</strong> · <strong>{formatPrice(pixModal.order.total)}</strong>
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={pixModal.payload} size={200} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs text-gray-500 mb-1 font-medium">Copia e Cola:</p>
              <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">{pixModal.payload}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyPix(pixModal.payload)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50"
              >
                {pixCopied ? '✓ Copiado!' : 'Copiar código'}
              </button>
              <button
                onClick={() => setPixModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--adm-primary)' }}
              >
                Fechar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Clique fora para fechar</p>
          </div>
        </div>
      )}
    </div>
  )
}
