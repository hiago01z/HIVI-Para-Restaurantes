'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, LayoutDashboard, Pause, Play, Trash2, CreditCard, Loader2 } from 'lucide-react'

type Loja = {
  id: string
  name: string
  slug: string
  is_active: boolean
  stripe_customer_id: string | null
  has_adm_password?: boolean
}

type Props = {
  lojas?: Loja[]
  showPortalOnly?: boolean
  AdmPasswordForm?: React.ComponentType<{ restaurantId: string; hasPassword: boolean }>
}

export function ContaActions({ lojas = [], showPortalOnly = false, AdmPasswordForm }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [localLojas, setLocalLojas] = useState<Loja[]>(lojas)

  async function handleToggle(loja: Loja) {
    setLoadingId(loja.id)
    try {
      const res = await fetch(`/api/restaurants/${loja.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !loja.is_active }),
      })
      if (res.ok) {
        setLocalLojas((prev) =>
          prev.map((l) => l.id === loja.id ? { ...l, is_active: !loja.is_active } : l)
        )
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(loja: Loja) {
    if (!confirm(`Excluir "${loja.name}" permanentemente? Esta ação não pode ser desfeita.`)) return
    setLoadingId(loja.id + '-del')
    try {
      const res = await fetch(`/api/restaurants/${loja.id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalLojas((prev) => prev.filter((l) => l.id !== loja.id))
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  if (showPortalOnly) {
    return (
      <button
        onClick={openPortal}
        disabled={portalLoading}
        className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {portalLoading ? 'Abrindo...' : 'Portal de pagamento'}
      </button>
    )
  }

  return (
    <>
      {localLojas.map((loja) => {
        const isToggling = loadingId === loja.id
        const isDeleting = loadingId === loja.id + '-del'

        return (
          <div key={loja.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">{loja.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/{loja.slug}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${loja.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loja.is_active ? 'Ativa' : 'Pausada'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/${loja.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver loja
              </Link>
              <Link
                href={`/${loja.slug}/adm`}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel ADM
              </Link>
              <button
                onClick={() => handleToggle(loja)}
                disabled={isToggling}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isToggling
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : loja.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {loja.is_active ? 'Pausar loja' : 'Ativar loja'}
              </button>
              <button
                onClick={() => handleDelete(loja)}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {isDeleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                Excluir loja
              </button>
            </div>

            {/* Senha ADM */}
            {AdmPasswordForm && (
              <div className="mt-2">
                <AdmPasswordForm
                  restaurantId={loja.id}
                  hasPassword={!!loja.has_adm_password}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
