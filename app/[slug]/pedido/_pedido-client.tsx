'use client'

import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Minus, Plus, Trash2, QrCode, Truck, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  slug: string
  restaurantId: string
}

type DeliveryForm = {
  name: string
  address: string
  reference: string
  phone: string
  payment: string
  change_for: string
}

export function PedidoClient({ slug, restaurantId }: Props) {
  const { items, totalPrice, totalItems, increment, decrement, removeItem, clearCart } = useCart()
  const router = useRouter()

  const [modal, setModal] = useState<null | 'qr' | 'delivery'>( null)
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryError, setDeliveryError] = useState('')
  const [form, setForm] = useState<DeliveryForm>({
    name: '', address: '', reference: '', phone: '', payment: 'dinheiro', change_for: '',
  })

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

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
          })),
          total: totalPrice,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      setQrSessionId(data.sessionId)
      setModal('qr')
    } catch {
      alert('Erro ao gerar QR Code. Tente novamente.')
    } finally {
      setQrLoading(false)
    }
  }

  async function handleDelivery(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setDeliveryError('Informe seu nome.'); return }
    if (!form.address.trim()) { setDeliveryError('Informe seu endereço.'); return }
    if (!form.phone.trim()) { setDeliveryError('Informe seu WhatsApp.'); return }

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
          customer_phone: form.phone,
          address: `${form.address}${form.reference ? ' — ' + form.reference : ''}`,
          payment_method: form.payment,
          change_for: form.payment === 'dinheiro' && form.change_for ? parseFloat(form.change_for) : null,
          total: totalPrice,
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name,
            product_price: i.price,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar pedido.')
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

  return (
    <div className="min-h-screen pb-24" style={{ color: 'white' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10" style={{ background: 'var(--menu-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href={`/${slug}`} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-black text-white flex-1">Seu pedido</h1>
        {totalItems > 0 && (
          <span className="text-white/40 text-sm">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-white/60 text-lg font-medium">Carrinho vazio</p>
          <p className="text-white/30 text-sm mt-2">Adicione itens do cardápio para fazer seu pedido.</p>
          <Link
            href={`/${slug}`}
            className="mt-6 px-6 py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'var(--menu-primary)' }}
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
                key={item.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} width={56} height={56} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm leading-tight truncate">{item.name}</p>
                  <p className="text-sm font-black mt-1" style={{ color: 'var(--menu-primary)' }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => decrement(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.10)' }}
                  >
                    <Minus className="w-3.5 h-3.5 text-white" />
                  </button>
                  <span className="text-white font-bold text-sm w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => increment(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--menu-primary)' }}
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center ml-1"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/50" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mx-4 mt-4 rounded-2xl px-4 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <span className="text-white/60 font-medium">Total</span>
            <span className="text-2xl font-black text-white">{formatPrice(totalPrice)}</span>
          </div>

          {/* Ações */}
          <div className="px-4 mt-6 space-y-3">
            <button
              onClick={handleGerarQR}
              disabled={qrLoading}
              className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-base"
              style={{ background: 'var(--menu-primary)' }}
            >
              {qrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
              {qrLoading ? 'Gerando...' : 'Gerar QR Code para a mesa'}
            </button>
            <button
              onClick={() => setModal('delivery')}
              className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-base"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Truck className="w-5 h-5" />
              Pedir para entrega
            </button>
          </div>
        </>
      )}

      {/* Modal QR Code */}
      {modal === 'qr' && qrSessionId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-t-3xl p-6 pb-10" style={{ background: 'var(--menu-bg)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">QR Code do pedido</h2>
              <button onClick={() => setModal(null)}>
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <p className="text-white/50 text-sm mb-6 text-center">Mostre este QR code ao garçom para confirmar seu pedido</p>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p className="text-white/40 text-xs mb-2">Itens do pedido</p>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-white/70 py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-black text-white">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
            <p className="text-white/30 text-xs text-center mt-4">Válido por 15 minutos</p>
          </div>
        </div>
      )}

      {/* Modal Entrega */}
      {modal === 'delivery' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 mt-10" style={{ background: 'var(--menu-bg)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Dados para entrega</h2>
              <button onClick={() => setModal(null)}>
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

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
              <DeliveryField
                label="WhatsApp *"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="(11) 99999-9999"
                type="tel"
              />

              {/* Forma de pagamento */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Forma de pagamento *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'dinheiro', label: 'Dinheiro' },
                    { value: 'cartao', label: 'Cartão' },
                    { value: 'pix', label: 'Pix' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, payment: opt.value })}
                      className="py-2.5 rounded-xl text-sm font-bold transition-colors"
                      style={{
                        background: form.payment === opt.value ? 'var(--menu-primary)' : 'rgba(255,255,255,0.08)',
                        color: 'white',
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
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between font-black text-white text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={deliveryLoading}
                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-base"
                style={{ background: 'var(--menu-primary)' }}
              >
                {deliveryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                {deliveryLoading ? 'Enviando pedido...' : 'Confirmar entrega'}
              </button>
            </form>
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
      <label className="block text-white/60 text-sm mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.10)',
          // @ts-expect-error css variable
          '--tw-ring-color': 'var(--menu-primary)',
        }}
      />
    </div>
  )
}
