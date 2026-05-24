'use client'

import { useCart } from '@/contexts/cart-context'
import { useFormatPrice, useCurrency } from '@/contexts/currency-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Minus, Plus, Trash2, QrCode, Truck, X, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { type DeliveryHoursConfig, checkDeliveryOpen } from '@/lib/delivery-hours'

type Props = {
  slug: string
  restaurantId: string
  deliveryEnabled: boolean
  deliveryHours: DeliveryHoursConfig
}

type DeliveryForm = {
  name: string
  address: string
  reference: string
  phone: string
  payment: string
  change_for: string
  notes: string
}

import {
  DEFAULT_COUNTRY_CODE,
  digitsOnly as phoneDigitsOnly,
  formatBrLocal,
  isPhoneValid as isPhoneValidFn,
  buildFullPhone,
} from '@/lib/phone'

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Aguardando confirmação', color: '#F59E0B' },
  confirmed:        { label: 'Confirmado',             color: '#3B82F6' },
  preparing:        { label: 'Sendo preparado',        color: '#8B5CF6' },
  ready:            { label: 'Pronto!',                color: '#10B981' },
  out_for_delivery: { label: 'Saiu para entrega',      color: '#F97316' },
  delivered:        { label: 'Entregue ✓',             color: '#22C55E' },
  cancelled:        { label: 'Cancelado',              color: '#EF4444' },
}

export function PedidoClient({ slug, restaurantId, deliveryEnabled, deliveryHours }: Props) {
  const { items, totalPrice, totalItems, increment, decrement, removeItem, clearCart } = useCart()
  const router = useRouter()
  const formatPrice = useFormatPrice()
  const currency = useCurrency()
  const [phoneCode, setPhoneCode] = useState(DEFAULT_COUNTRY_CODE[currency] ?? '55')

  const [modal, setModal] = useState<null | 'qr' | 'delivery'>(null)
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [qrConfirmed, setQrConfirmed] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [qrNotes, setQrNotes] = useState('')
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryError, setDeliveryError] = useState('')
  const [form, setForm] = useState<DeliveryForm>({
    name: '', address: '', reference: '', phone: '', payment: 'dinheiro', change_for: '', notes: '',
  })

  // ── Horário de funcionamento das entregas ────────────────────────────────────
  const [deliveryStatus, setDeliveryStatus] = useState(() => checkDeliveryOpen(deliveryHours))

  useEffect(() => {
    // Recalcula a cada minuto (a hora pode mudar enquanto o cliente está na página)
    const timer = setInterval(() => {
      setDeliveryStatus(checkDeliveryOpen(deliveryHours))
    }, 60_000)
    return () => clearInterval(timer)
  }, [deliveryHours])

  // ── Dados de entrega salvos (localStorage) ───────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hivi-delivery-info')
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DeliveryForm>
        setForm((prev) => ({
          ...prev,
          name:      parsed.name      ?? '',
          address:   parsed.address   ?? '',
          reference: parsed.reference ?? '',
          phone:     parsed.phone     ?? '',
        }))
      }
    } catch { /* ignore */ }
  }, [])

  // ── Pedido ativo (localStorage) ──────────────────────────────────────────────
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeOrderData, setActiveOrderData] = useState<{ order_number: number; status: string; total: number } | null>(null)

  // Lê o orderId salvo no localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hivi-active-order-${slug}`)
      if (saved) setActiveOrderId(saved)
    } catch { /* ignore */ }
  }, [slug])

  // Busca os dados do pedido e escuta atualizações em tempo real
  useEffect(() => {
    if (!activeOrderId) return
    const supabase = createClient()
    let subscribed = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null

    supabase
      .from('orders')
      .select('order_number, status, total')
      .eq('id', activeOrderId)
      .single()
      .then(({ data, error }) => {
        if (!subscribed) return
        if (error || !data) {
          try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
          setActiveOrderId(null)
          return
        }
        setActiveOrderData(data)
        if (['delivered', 'cancelled'].includes(data.status)) {
          try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
        }
        channel = supabase
          .channel(`pedido-track-${activeOrderId}`)
          .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrderId}`,
          }, (payload) => {
            if (payload.new?.status) {
              const newStatus = payload.new.status as string
              setActiveOrderData((prev) => prev ? { ...prev, status: newStatus } : prev)
              if (['delivered', 'cancelled'].includes(newStatus)) {
                try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
              }
            }
          })
          .subscribe()
      })

    return () => {
      subscribed = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [activeOrderId, slug])

  // Escuta a sessão QR em tempo real — quando o garçom confirmar, mostra sucesso e limpa o carrinho
  useEffect(() => {
    if (!qrSessionId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`qr-session-${qrSessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'qr_sessions', filter: `id=eq.${qrSessionId}` },
        (payload) => {
          if (payload.new?.confirmed) {
            setQrConfirmed(true)
            const orderId = payload.new.order_id
            // Persiste o pedido no localStorage para acesso após fechar o navegador
            if (orderId) {
              try { localStorage.setItem(`hivi-active-order-${slug}`, orderId) } catch {}
            }
            // Após 2.5s: limpa carrinho e redireciona para acompanhamento
            setTimeout(() => {
              clearCart()
              if (orderId) {
                router.push(`/${slug}/meu-pedido/${orderId}`)
              } else {
                router.push(`/${slug}`)
              }
            }, 2500)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qrSessionId, slug, clearCart, router])

  async function handleGerarQR() {
    setQrLoading(true)
    try {
      const res = await fetch('/api/qrcode/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name,
            product_price: i.price,
            quantity: i.quantity,
            selected_options: i.selectedOptions ?? null,
          })),
          total: totalPrice,
          notes: qrNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      setQrSessionId(data.sessionId)
      setQrError('')
      setModal('qr')
    } catch {
      setQrError('Erro ao gerar QR Code. Tente novamente.')
    } finally {
      setQrLoading(false)
    }
  }

  async function handleDelivery(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setDeliveryError('Informe seu nome.'); return }
    if (!form.address.trim()) { setDeliveryError('Informe seu endereço.'); return }
    if (!isPhoneValidFn(phoneCode, form.phone)) { setDeliveryError('Informe um WhatsApp válido.'); return }

    setDeliveryLoading(true)
    setDeliveryError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          type: 'delivery',
          customer_name: form.name,
          customer_phone: buildFullPhone(phoneCode, form.phone),
          address: `${form.address}${form.reference ? ' — ' + form.reference : ''}`,
          payment_method: form.payment,
          change_for: form.payment === 'dinheiro' && form.change_for ? parseFloat(form.change_for) : null,
          notes: form.notes.trim() || null,
          total: totalPrice,
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name,
            product_price: i.price,
            quantity: i.quantity,
            selected_options: i.selectedOptions ?? null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar pedido.')
      // Salva dados pessoais para pré-preencher no próximo pedido
      try {
        localStorage.setItem('hivi-delivery-info', JSON.stringify({
          name:      form.name,
          address:   form.address,
          reference: form.reference,
          phone:     form.phone,
        }))
      } catch { /* ignore */ }
      // Persiste o pedido no localStorage para acesso após fechar o navegador
      try { localStorage.setItem(`hivi-active-order-${slug}`, data.orderId) } catch {}
      clearCart()
      router.push(`/${slug}/meu-pedido/${data.orderId}`)
    } catch (err: unknown) {
      setDeliveryError(err instanceof Error ? err.message : 'Erro ao criar pedido.')
      setDeliveryLoading(false)
    }
  }

  const qrUrl = qrSessionId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/adm/qr/${qrSessionId}`
    : ''

  const aoStatus = activeOrderData
    ? (ORDER_STATUS_MAP[activeOrderData.status] ?? { label: activeOrderData.status, color: '#6B7280' })
    : null
  const aoIsTerminal = activeOrderData
    ? ['delivered', 'cancelled'].includes(activeOrderData.status)
    : false

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--menu-text)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10" style={{ background: 'var(--menu-bg)', borderBottom: '1px solid rgba(128,128,128,0.15)' }}>
        <Link href={`/${slug}`} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--menu-card)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--menu-text)' }} />
        </Link>
        <h1 className="text-lg font-black flex-1" style={{ color: 'var(--menu-text)' }}>Seu pedido</h1>
        {totalItems > 0 && (
          <span className="text-sm" style={{ color: 'var(--menu-text-muted)' }}>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
        )}
      </div>

      {/* Seção: pedido em andamento */}
      {activeOrderData && aoStatus && activeOrderId && (
        <div className="px-4 mt-4">
          <p className="text-xs uppercase tracking-widest font-black mb-2 px-1" style={{ color: 'var(--menu-text-muted)' }}>
            Pedido em andamento
          </p>
          <Link
            href={`/${slug}/meu-pedido/${activeOrderId}`}
            className="flex items-center gap-3 rounded-2xl px-4 py-4"
            style={{ background: 'var(--menu-card)' }}
          >
            {/* Indicador de status com pulse */}
            <span className="relative flex-shrink-0 w-3 h-3">
              {!aoIsTerminal && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: aoStatus.color }}
                />
              )}
              <span
                className="relative inline-flex rounded-full w-3 h-3"
                style={{ background: aoStatus.color }}
              />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: 'var(--menu-text-muted)' }}>
                Pedido #{activeOrderData.order_number} · {formatPrice(activeOrderData.total)}
              </p>
              <p className="text-sm font-black" style={{ color: aoStatus.color }}>
                {aoStatus.label}
              </p>
            </div>

            <span
              className="text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
            >
              Ver detalhes
            </span>
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-lg font-medium" style={{ color: 'var(--menu-text-muted)' }}>Carrinho vazio</p>
          <p className="text-sm mt-2" style={{ color: 'var(--menu-text-muted)', opacity: 0.6 }}>Adicione itens do cardápio para fazer seu pedido.</p>
          <Link
            href={`/${slug}`}
            className="mt-6 px-6 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
          >
            Ver cardápio
          </Link>
        </div>
      ) : (
        <>
          {/* Itens */}
          <div className="px-4 mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.cartKey ?? item.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'var(--menu-card)' }}
              >
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} width={56} height={56} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(128,128,128,0.10)' }}>
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--menu-text)' }}>{item.name}</p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--menu-text-muted)' }}>
                      {item.selectedOptions.map((o) => o.item_name).join(', ')}
                    </p>
                  )}
                  <p className="text-sm font-black mt-1" style={{ color: 'var(--menu-primary)' }}>
                    {formatPrice(
                      (item.price + (item.selectedOptions ?? []).reduce((s, o) => s + o.price_addition, 0)) * item.quantity
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => decrement(item.cartKey ?? item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(128,128,128,0.15)' }}
                  >
                    <Minus className="w-3.5 h-3.5" style={{ color: 'var(--menu-text)' }} />
                  </button>
                  <span className="font-bold text-sm w-5 text-center" style={{ color: 'var(--menu-text)' }}>{item.quantity}</span>
                  <button
                    onClick={() => increment(item.cartKey ?? item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.cartKey ?? item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center ml-1"
                    style={{ background: 'rgba(128,128,128,0.10)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--menu-text-muted)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-4 mt-4 rounded-2xl px-4 py-4 flex items-center justify-between" style={{ background: 'var(--menu-card)' }}>
            <span className="font-medium" style={{ color: 'var(--menu-text-muted)' }}>Total</span>
            <span className="text-2xl font-black" style={{ color: 'var(--menu-text)' }}>{formatPrice(totalPrice)}</span>
          </div>

          {/* Ações */}
          <div className="px-4 mt-6 space-y-3">
            {/* Observações do pedido (para mesa via QR) */}
            <DeliveryTextarea
              label="Observações (opcional)"
              value={qrNotes}
              onChange={setQrNotes}
              placeholder="Ex: sem cebola, bem passado, sem glúten..."
            />
            {qrError && (
              <div className="rounded-2xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                {qrError}
              </div>
            )}
            <button
              onClick={handleGerarQR}
              disabled={qrLoading}
              className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
            >
              {qrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
              {qrLoading ? 'Gerando...' : 'Gerar QR Code para a mesa'}
            </button>
            {!deliveryEnabled ? null : deliveryStatus.open ? (
              <button
                onClick={() => setModal('delivery')}
                className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base"
                style={{ background: 'var(--menu-card)', color: 'var(--menu-text)', border: '1px solid rgba(128,128,128,0.20)' }}
              >
                <Truck className="w-5 h-5" />
                Pedir para entrega
              </button>
            ) : (
              <div className="space-y-2">
                {/* Botão desabilitado por horário */}
                <button
                  disabled
                  className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base opacity-40 cursor-not-allowed"
                  style={{ background: 'var(--menu-card)', color: 'var(--menu-text)', border: '1px solid rgba(128,128,128,0.20)' }}
                >
                  <Truck className="w-5 h-5" />
                  Entrega fechada agora
                </button>
                {/* Card informativo de horário */}
                <div
                  className="rounded-2xl px-4 py-3 space-y-1.5"
                  style={{ background: 'var(--menu-card)', border: '1px solid rgba(128,128,128,0.15)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--menu-primary)' }} />
                    <span className="text-xs font-black" style={{ color: 'var(--menu-text)' }}>
                      {deliveryStatus.closedMessage}
                    </span>
                  </div>
                  {deliveryStatus.scheduleLines.length > 0 && (
                    <div className="space-y-0.5 pt-1 border-t" style={{ borderColor: 'rgba(128,128,128,0.15)' }}>
                      {deliveryStatus.scheduleLines.map((line) => (
                        <p key={line} className="text-xs" style={{ color: 'var(--menu-text-muted)', opacity: 0.75 }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal QR Code */}
      {modal === 'qr' && qrSessionId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-t-3xl p-6 pb-10" style={{ background: 'var(--menu-bg)', borderTop: '1px solid rgba(128,128,128,0.15)' }}>

            {/* ── Estado: Confirmado pelo garçom ── */}
            {qrConfirmed ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{ background: '#22c55e20', border: '2px solid #22c55e' }}
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--menu-text)' }}>
                  Pedido confirmado! 🎉
                </h2>
                <p className="text-sm" style={{ color: 'var(--menu-text-muted)' }}>
                  Seu pedido foi registrado. Redirecionando para o acompanhamento...
                </p>
                <div className="mt-5 flex gap-1">
                  {[0,1,2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-green-400"
                      style={{ animation: `bounce 1s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
                <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
              </div>
            ) : (
              /* ── Estado: Aguardando escaneamento ── */
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black" style={{ color: 'var(--menu-text)' }}>QR Code do pedido</h2>
                  <button onClick={() => setModal(null)} style={{ color: 'var(--menu-text-muted)' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm mb-6 text-center" style={{ color: 'var(--menu-text-muted)' }}>
                  Mostre este QR code ao garçom para confirmar seu pedido
                </p>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG value={qrUrl} size={200} />
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'var(--menu-card)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--menu-text-muted)' }}>Itens do pedido</p>
                  {items.map((item) => {
                    const unitPrice = item.price + (item.selectedOptions ?? []).reduce((s, o) => s + o.price_addition, 0)
                    return (
                      <div key={item.cartKey ?? item.id} className="py-1" style={{ color: 'var(--menu-text-muted)' }}>
                        <div className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span>{formatPrice(unitPrice * item.quantity)}</span>
                        </div>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <p className="text-xs pl-4 mt-0.5" style={{ opacity: 0.7 }}>
                            {item.selectedOptions.map((o) => o.item_name).join(', ')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <div className="mt-2 pt-2 flex justify-between font-black" style={{ borderTop: '1px solid rgba(128,128,128,0.15)', color: 'var(--menu-text)' }}>
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <p className="text-xs text-center mt-4" style={{ color: 'var(--menu-text-muted)', opacity: 0.6 }}>Válido por 15 minutos</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Entrega */}
      {modal === 'delivery' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-md rounded-t-3xl overflow-y-auto overscroll-contain"
            style={{
              background: 'var(--menu-bg)',
              borderTop: '1px solid rgba(128,128,128,0.15)',
              maxHeight: '92dvh',
            }}
          >
          <div className="p-6 pb-10">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-black" style={{ color: 'var(--menu-text)' }}>Dados para entrega</h2>
              <button onClick={() => setModal(null)} style={{ color: 'var(--menu-text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {form.name && (
              <p className="text-xs mb-5" style={{ color: 'var(--menu-text-muted)', opacity: 0.55 }}>
                Preenchido com seu último pedido · <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => setForm({ name: '', address: '', reference: '', phone: '', payment: 'dinheiro', change_for: '', notes: '' })}
                >
                  limpar
                </button>
              </p>
            )}
            {!form.name && <div className="mb-6" />}

            <form onSubmit={handleDelivery} className="space-y-4">
              <DeliveryField
                label="Seu nome *"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Ex: João Silva"
              />
              <DeliveryField
                label="Endereço completo (rua + número) *"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                placeholder="Ex: Rua das Flores, 123"
              />
              <DeliveryField
                label="Ponto de referência"
                value={form.reference}
                onChange={(v) => setForm({ ...form, reference: v })}
                placeholder="Ex: Próximo ao mercado"
              />
              {/* Campo de telefone com código de país editável */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--menu-text-muted)' }}>WhatsApp *</label>
                <div className="flex gap-2">
                  {/* Código de país */}
                  <div className="relative flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--menu-text-muted)' }}>+</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(phoneDigitsOnly(e.target.value).slice(0, 4))}
                      className="w-16 pl-6 pr-2 py-3 rounded-xl text-sm text-center focus:outline-none focus:ring-2"
                      style={{
                        background: 'var(--menu-card)',
                        border: '1px solid rgba(128,128,128,0.20)',
                        color: 'var(--menu-text)',
                        caretColor: 'var(--menu-primary)',
                      }}
                    />
                  </div>
                  {/* Número local */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => {
                        const local = phoneCode === '55'
                          ? formatBrLocal(e.target.value)
                          : phoneDigitsOnly(e.target.value).slice(0, 15)
                        setForm({ ...form, phone: local })
                      }}
                      placeholder={phoneCode === '55' ? '(11) 99999-9999' : '912 345 678'}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{
                        background: 'var(--menu-card)',
                        border: `1px solid ${
                          phoneDigitsOnly(form.phone).length === 0
                            ? 'rgba(128,128,128,0.20)'
                            : isPhoneValidFn(phoneCode, form.phone)
                            ? '#22c55e'
                            : '#ef4444'
                        }`,
                        color: 'var(--menu-text)',
                        caretColor: 'var(--menu-primary)',
                      }}
                    />
                    {phoneDigitsOnly(form.phone).length > 0 && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                        style={{ color: isPhoneValidFn(phoneCode, form.phone) ? '#22c55e' : '#ef4444' }}
                      >
                        {isPhoneValidFn(phoneCode, form.phone) ? '✓' : phoneCode === '55' ? 'DDD + nº' : 'nº inválido'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs mt-1 px-1" style={{ color: 'var(--menu-text-muted)', opacity: 0.6 }}>
                  {phoneCode === '55' ? 'DDD + número · sem o +55' : `Número local · código +${phoneCode} editável`}
                </p>
              </div>
              <DeliveryTextarea
                label="Observações"
                value={form.notes}
                onChange={(v) => setForm({ ...form, notes: v })}
                placeholder="Ex: sem cebola, ponto da carne, etc."
              />

              {/* Forma de pagamento */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--menu-text-muted)' }}>Forma de pagamento *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'dinheiro', label: 'Dinheiro' },
                    { value: 'cartao', label: 'Cartão' },
                    ...(currency !== 'EUR' ? [{ value: 'pix', label: 'Pix' }] : []),
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, payment: opt.value })}
                      className="py-2.5 rounded-xl text-sm font-bold transition-colors"
                      style={{
                        background: form.payment === opt.value ? 'var(--menu-primary)' : 'var(--menu-card)',
                        color: form.payment === opt.value ? 'var(--menu-text-on-primary)' : 'var(--menu-text)',
                        border: '1px solid rgba(128,128,128,0.15)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.payment === 'dinheiro' && (
                <DeliveryField
                  label="Troco para"
                  value={form.change_for}
                  onChange={(v) => setForm({ ...form, change_for: v })}
                  placeholder="Ex: 50,00"
                  type="number"
                />
              )}

              {deliveryError && (
                <div className="rounded-xl px-4 py-3 bg-red-900/30 border border-red-500/30">
                  <p className="text-red-400 text-sm">{deliveryError}</p>
                </div>
              )}

              {/* Resumo */}
              <div className="rounded-2xl p-4" style={{ background: 'var(--menu-card)' }}>
                <div className="flex justify-between font-black text-lg" style={{ color: 'var(--menu-text)' }}>
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={deliveryLoading}
                className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-base"
                style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
              >
                {deliveryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                {deliveryLoading ? 'Enviando pedido...' : 'Confirmar entrega'}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeliveryField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: 'var(--menu-text-muted)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
        style={{
          background: 'var(--menu-card)',
          border: '1px solid rgba(128,128,128,0.20)',
          color: 'var(--menu-text)',
          // @ts-expect-error css variable
          '--tw-ring-color': 'var(--menu-primary)',
        }}
      />
    </div>
  )
}

function DeliveryTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: 'var(--menu-text-muted)' }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
        style={{
          background: 'var(--menu-card)',
          border: '1px solid rgba(128,128,128,0.20)',
          color: 'var(--menu-text)',
          // @ts-expect-error css variable
          '--tw-ring-color': 'var(--menu-primary)',
        }}
      />
    </div>
  )
}
