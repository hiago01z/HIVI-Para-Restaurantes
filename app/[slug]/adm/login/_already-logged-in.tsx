'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  slug: string
  memberName: string
  roleLabel: string
  panelUrl: string
}

export function AlreadyLoggedIn({ slug, memberName, roleLabel, panelUrl }: Props) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch(`/api/adm/${slug}/logout`, { method: 'POST' })
    window.location.href = `/${slug}/adm/login`
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Já autenticado</h1>
        <p className="text-gray-400 text-sm mb-1">
          Logado como <span className="text-white font-semibold">{memberName}</span>
        </p>
        <p className="text-gray-600 text-xs mb-8">
          {slug} · {roleLabel}
        </p>
        <div className="space-y-3">
          <a
            href={panelUrl}
            className="block w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-colors text-center text-base"
          >
            Entrar no painel
          </a>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 border border-gray-700 text-gray-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {signingOut && <Loader2 className="w-4 h-4 animate-spin" />}
            {signingOut ? 'Saindo...' : 'Sair e entrar como outro'}
          </button>
        </div>
      </div>
    </div>
  )
}
