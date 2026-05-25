'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'
import { trackPurchase } from '@/lib/fbq'

const PLAN_VALUES: Record<string, Record<string, number>> = {
  BRL: { basic: 59.99, pro: 99.99 },
  EUR: { basic: 24.99, pro: 39.99 },
}

export function SuccessBanner() {
  const [visible, setVisible] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const plan     = searchParams.get('plan')     // 'basic' | 'pro'
    const currency = searchParams.get('currency') // 'BRL' | 'EUR'

    if (!plan || !currency) return

    const value = PLAN_VALUES[currency]?.[plan]
    if (!value) return

    trackPurchase({
      value,
      currency: currency as 'BRL' | 'EUR',
      content_name: plan === 'pro' ? 'Plano Pro' : 'Plano Básico',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  return (
    <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-green-800 text-sm">Cardápio criado com sucesso! 🎉</p>
        <p className="text-green-700 text-sm mt-0.5">
          Seu cardápio digital já está no ar. Acesse o painel administrativo para cadastrar suas categorias e pratos.
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-green-500 hover:text-green-700 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
