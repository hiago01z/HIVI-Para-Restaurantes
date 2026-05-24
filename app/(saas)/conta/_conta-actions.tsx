'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, LayoutDashboard, Pause, Play, Trash2, CreditCard, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

type Loja = {
  id: string
  name: string
  slug: string
  is_active: boolean
  stripe_customer_id: string | null
  has_adm_password?: boolean
  plan?: 'free' | 'basic' | 'pro'
  trial_ends_at?: string | null
  currency?: 'BRL' | 'EUR'
}

function planPrices(currency: 'BRL' | 'EUR' = 'BRL') {
  return currency === 'EUR'
    ? { basic: '24,99 €/mês', pro: '39,99 €/mês' }
    : { basic: 'R$ 59,99/mês', pro: 'R$ 99,99/mês' }
}

function trialDaysLeft(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
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
  const [portalError, setPortalError] = useState('')
  const [actionError, setActionError] = useState<Record<string, string>>({})
  const [localLojas, setLocalLojas] = useState<Loja[]>(lojas)
  const [upgradingId, setUpgradingId]   = useState<string | null>(null)
  const [downgradingId, setDowngradingId] = useState<string | null>(null)
  const [subscribingId, setSubscribingId] = useState<string | null>(null) // free → basic/pro

  function setLojaError(id: string, msg: string) {
    setActionError((prev) => ({ ...prev, [id]: msg }))
    setTimeout(() => setActionError((prev) => { const n = { ...prev }; delete n[id]; return n }), 4000)
  }

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
      } else {
        setLojaError(loja.id, 'Erro ao alterar status do cardápio. Tente novamente.')
      }
    } catch {
      setLojaError(loja.id, 'Erro de conexão. Tente novamente.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(loja: Loja) {
    if (!confirm(`Excluir o cardápio "${loja.name}" permanentemente? Esta ação não pode ser desfeita.`)) return
    setLoadingId(loja.id + '-del')
    try {
      const res = await fetch(`/api/restaurants/${loja.id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalLojas((prev) => prev.filter((l) => l.id !== loja.id))
        router.refresh()
      } else {
        setLojaError(loja.id + '-del', 'Erro ao excluir o cardápio. Tente novamente.')
      }
    } catch {
      setLojaError(loja.id + '-del', 'Erro de conexão. Tente novamente.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleUpgrade(loja: Loja) {
    setUpgradingId(loja.id)
    try {
      const res = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: loja.id }),
      })
      const data = await res.json()
      if (data.upgraded) {
        // Upgrade via subscription update — sem redirect
        setLocalLojas((prev) =>
          prev.map((l) => l.id === loja.id ? { ...l, plan: 'pro' } : l)
        )
        router.refresh()
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setLojaError(loja.id, data.error ?? 'Erro ao iniciar upgrade.')
      }
    } catch {
      setLojaError(loja.id, 'Erro de conexão. Tente novamente.')
    } finally {
      setUpgradingId(null)
    }
  }

  async function handleDowngrade(loja: Loja) {
    if (!confirm(`Fazer downgrade de "${loja.name}" para o Plano Básico?\n\nO plano muda imediatamente e a próxima fatura será ${planPrices(loja.currency).basic}. Você perderá acesso ao Analytics.`)) return
    setDowngradingId(loja.id)
    try {
      const res = await fetch('/api/stripe/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: loja.id }),
      })
      const data = await res.json()
      if (data.downgraded) {
        setLocalLojas((prev) =>
          prev.map((l) => l.id === loja.id ? { ...l, plan: 'basic' } : l)
        )
        router.refresh()
      } else {
        setLojaError(loja.id, data.error ?? 'Erro ao fazer downgrade.')
      }
    } catch {
      setLojaError(loja.id, 'Erro de conexão. Tente novamente.')
    } finally {
      setDowngradingId(null)
    }
  }

  async function handleSubscribe(loja: Loja, plan: 'basic' | 'pro') {
    setSubscribingId(loja.id + '-' + plan)
    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: loja.id, plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLojaError(loja.id, data.error ?? 'Erro ao iniciar assinatura.')
      }
    } catch {
      setLojaError(loja.id, 'Erro de conexão. Tente novamente.')
    } finally {
      setSubscribingId(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError(data.error ?? 'Erro ao abrir portal de pagamento. Tente novamente.')
        setTimeout(() => setPortalError(''), 4000)
      }
    } catch {
      setPortalError('Erro de conexão. Tente novamente.')
      setTimeout(() => setPortalError(''), 4000)
    } finally {
      setPortalLoading(false)
    }
  }

  if (showPortalOnly) {
    return (
      <div>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {portalLoading ? 'Abrindo...' : 'Portal de pagamento'}
        </button>
        {portalError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{portalError}</p>
        )}
      </div>
    )
  }

  return (
    <>
      {localLojas.map((loja) => {
        const isToggling = loadingId === loja.id
        const isDeleting = loadingId === loja.id + '-del'
        const pp = planPrices(loja.currency)

        return (
          <div key={loja.id} className="bg-white rounded-2xl p-5 shadow-sm">
            {/* Banner de trial */}
            {(() => {
              const days = trialDaysLeft(loja.trial_ends_at)
              if (days <= 0) return null
              const urgent = days <= 2
              return (
                <div className={`rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2 ${
                  urgent
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}>
                  <span className={`text-xs font-semibold ${urgent ? 'text-red-700' : 'text-orange-700'}`}>
                    🎉 Trial Pro ativo
                  </span>
                  <span className={`text-xs font-black ${urgent ? 'text-red-600' : 'text-orange-600'}`}>
                    {days === 1 ? 'Último dia!' : `${days} dias restantes`}
                  </span>
                </div>
              )
            })()}

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">{loja.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}/{loja.slug}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Badge de plano */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  loja.plan === 'pro'
                    ? 'bg-orange-100 text-orange-700'
                    : loja.plan === 'free'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {loja.plan === 'pro' ? 'Pro ★' : loja.plan === 'free' ? 'Grátis' : 'Básico'}
                </span>
                {/* Badge de status */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${loja.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {loja.is_active ? 'Ativa' : 'Pausada'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/${loja.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver cardápio
              </Link>
              <Link
                href={`/${loja.slug}/adm/login`}
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
                {loja.is_active ? 'Pausar cardápio' : 'Ativar cardápio'}
              </button>
              <button
                onClick={() => handleDelete(loja)}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {isDeleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                Excluir cardápio
              </button>
            </div>

            {/* Plano Free: dois botões para assinar Básico ou Pro */}
            {loja.plan === 'free' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSubscribe(loja, 'basic')}
                  disabled={subscribingId !== null}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {subscribingId === loja.id + '-basic'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <TrendingUp className="w-3.5 h-3.5" />}
                  {subscribingId === loja.id + '-basic' ? 'Abrindo...' : `Básico — ${pp.basic}`}
                </button>
                <button
                  onClick={() => handleSubscribe(loja, 'pro')}
                  disabled={subscribingId !== null}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 rounded-xl text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {subscribingId === loja.id + '-pro'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <TrendingUp className="w-3.5 h-3.5" />}
                  {subscribingId === loja.id + '-pro' ? 'Abrindo...' : `Pro ★ — ${pp.pro}`}
                </button>
              </div>
            )}

            {/* Plano Básico: upgrade para Pro */}
            {loja.plan === 'basic' && (
              <button
                onClick={() => handleUpgrade(loja)}
                disabled={upgradingId === loja.id}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-600 hover:bg-orange-100 disabled:opacity-50 transition-colors"
              >
                {upgradingId === loja.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <TrendingUp className="w-4 h-4" />}
                {upgradingId === loja.id ? 'Processando...' : `Fazer upgrade para Pro — ${pp.pro}`}
              </button>
            )}

            {/* Plano Pro: downgrade para Básico */}
            {loja.plan === 'pro' && (
              <button
                onClick={() => handleDowngrade(loja)}
                disabled={downgradingId === loja.id}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {downgradingId === loja.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <TrendingDown className="w-4 h-4" />}
                {downgradingId === loja.id ? 'Processando...' : `Voltar para o Básico — ${pp.basic}`}
              </button>
            )}

            {/* Erro de ação */}
            {(actionError[loja.id] || actionError[loja.id + '-del']) && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {actionError[loja.id] ?? actionError[loja.id + '-del']}
              </p>
            )}

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
