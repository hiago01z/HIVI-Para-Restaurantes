'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Clock } from 'lucide-react'
import { formatCurrency, type SupportedCurrency } from '@/lib/currency'

type OrderItem = {
  product_id: string
  product_name: string
  product_price: number
  quantity: number
}

type Props = {
  session: {
    id: string
    confirmed: boolean
    expired: boolean
    orderData: { items: OrderItem[]; total: number }
  }
  restaurantName: string
  currency?: SupportedCurrency
}

export function QrConfirmClient({ session, restaurantName, currency = 'BRL' }: Props) {
  const formatPrice = (v: number) => formatCurrency(v, currency)
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(session.confirmed)
  const [erro, setErro] = useState('')

  async function handleConfirm() {
    if (!customerName.trim()) { setErro('Informe o nome do cliente.'); return }
    if (!tableNumber.trim()) { setErro('Informe o número da mesa.'); return }

    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/qrcode/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          customer_name: customerName.trim(),
          table_number: tableNumber.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao confirmar pedido.')
        setLoading(false)
        return
      }

      setDone(true)
      setTimeout(() => router.back(), 2500)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  // Expirado
  if (session.expired && !done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">QR Code expirado</h1>
          <p className="text-gray-500 text-sm">
            Este QR code expirou. Peça ao cliente para gerar um novo.
          </p>
        </div>
      </div>
    )
  }

  // Já confirmado ou sucesso
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Pedido confirmado!</h1>
          <p className="text-gray-500 text-sm">
            O pedido foi registrado e aparece na aba &quot;Mesa&quot; dos pedidos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-black text-gray-900">Confirmar pedido</h1>
        <p className="text-gray-400 text-sm mt-1">{restaurantName}</p>
      </div>

      {/* Itens do pedido */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Itens do pedido</p>
        <div className="space-y-2.5">
          {session.orderData.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 text-xs font-black rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--adm-primary) 15%, white)', color: 'var(--adm-primary)' }}>
                  {item.quantity}
                </span>
                <span className="text-sm text-gray-700">{item.product_name}</span>
              </div>
              <span className="text-sm text-gray-500">{formatPrice(item.product_price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between font-black text-gray-900">
          <span>Total</span>
          <span>{formatPrice(session.orderData.total)}</span>
        </div>
      </div>

      {/* Dados do atendimento */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dados do atendimento</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do cliente</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: João"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Número da mesa</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Ex: 5"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
          />
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-600 text-sm">{erro}</p>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-4 disabled:opacity-50 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
        style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        {loading ? 'Confirmando...' : 'Confirmar pedido'}
      </button>
    </div>
  )
}
