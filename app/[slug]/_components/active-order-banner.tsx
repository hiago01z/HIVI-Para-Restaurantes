'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, X } from 'lucide-react'

type Props = { slug: string }

export function ActiveOrderBanner({ slug }: Props) {
  const [orderId, setOrderId] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hivi-active-order-${slug}`)
      if (saved) setOrderId(saved)
    } catch { /* ignore */ }
  }, [slug])

  // Não exibe na página de acompanhamento (usuário já está lá) nem na tela de pedido
  const hidden = pathname.includes('/meu-pedido') || pathname.endsWith('/pedido')
  if (!orderId || hidden) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div
        className="max-w-md mx-auto rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl pointer-events-auto"
        style={{ background: '#16a34a', color: '#fff' }}
      >
        <ChefHat className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight">Pedido em andamento</p>
          <p className="text-xs opacity-75">Toque para acompanhar</p>
        </div>
        <Link
          href={`/${slug}/meu-pedido/${orderId}`}
          className="text-xs font-black px-3 py-1.5 rounded-xl shrink-0"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          Acompanhar
        </Link>
        <button
          onClick={() => {
            try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
            setOrderId(null)
          }}
          className="opacity-70 hover:opacity-100 shrink-0"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
