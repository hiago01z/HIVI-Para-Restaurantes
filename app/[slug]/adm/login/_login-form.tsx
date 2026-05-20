'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginForm({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  // Valida que o redirect é relativo (começa com /) para evitar open redirect
  const redirectParam = searchParams.get('redirect') ?? ''
  const redirect = redirectParam.startsWith('/') ? redirectParam : `/${slug}/adm/pedidos`

  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setErro('')
    setLoading(true)

    try {
      const res = await fetch(`/api/adm/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error ?? 'Senha incorreta')
        setLoading(false)   // só reseta no erro — no sucesso o botão fica em "Verificando..."
        return
      }

      // Hard redirect: garante que o cookie httpOnly vai junto no próximo request
      // e limpa qualquer cache do router que pudesse servir páginas antigas.
      // loading permanece true até a página descarregar — feedback correto para o usuário.
      window.location.href = redirect
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Painel ADM</h1>
          <p className="text-gray-400 text-sm mt-1">
            <span className="font-semibold text-orange-400">{slug}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha do ADM</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-8">
          Senha criada pelo dono em{' '}
          <Link href="/conta" className="text-orange-500 hover:underline">hivi-web.com/conta</Link>
        </p>
      </div>
    </div>
  )
}
