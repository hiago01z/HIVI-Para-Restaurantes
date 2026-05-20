'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, Eye, EyeOff, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  // Valida que o redirect é relativo (começa com /) para evitar open redirect
  const redirectParam = searchParams.get('redirect') ?? ''
  const redirect = redirectParam.startsWith('/') && !redirectParam.startsWith('//')
    ? redirectParam
    : `/${slug}/adm/pedidos`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Tenta pré-preencher o e-mail a partir da sessão SAAS (se o usuário estiver logado)
  useEffect(() => {
    async function prefillEmail() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) setEmail(user.email)
      } catch {
        // sem sessão SAAS — deixa o campo em branco
      }
    }
    prefillEmail()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setErro('')
    setLoading(true)

    try {
      const res = await fetch(`/api/adm/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error ?? 'E-mail ou senha incorretos')
        setLoading(false)
        return
      }

      // Hard redirect: garante que o cookie httpOnly vai junto no próximo request
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
          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="username"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha do ADM</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus={!!email}
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
            disabled={loading || !email || !password}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-8">
          Senha criada em{' '}
          <Link href="/conta" className="text-orange-500 hover:underline">hivi-web.com/conta</Link>
        </p>
      </div>
    </div>
  )
}
