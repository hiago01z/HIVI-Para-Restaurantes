'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react'

export function AdmPasswordForm({ restaurantId, hasPassword }: { restaurantId: string; hasPassword: boolean }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/adm-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erro ao salvar')
        return
      }
      setSaved(true)
      setPassword('')
      setConfirm('')
      setTimeout(() => { setSaved(false); setOpen(false) }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 py-2.5 rounded-xl text-sm font-medium w-full justify-center transition-colors border ${
          hasPassword
            ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
            : 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
        }`}
      >
        <Lock className="w-4 h-4" />
        {hasPassword ? 'Alterar senha ADM' : 'Definir senha ADM'}
        {!hasPassword && <span className="ml-1 text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">Pendente</span>}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <p className="text-xs text-gray-500">
            {hasPassword ? 'Altere a senha usada para acessar o painel ADM.' : 'Defina a senha que será usada para acessar o painel ADM do seu restaurante.'}
          </p>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="w-full px-3 py-2.5 pr-9 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar senha"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading || saved}
              className={`flex-1 py-2 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-colors ${saved ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'} disabled:opacity-50`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved && <Check className="w-4 h-4" />}
              {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar senha'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 border border-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
