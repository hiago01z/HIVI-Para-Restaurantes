'use client'

import { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export function SuccessBanner() {
  const [visible, setVisible] = useState(true)

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
