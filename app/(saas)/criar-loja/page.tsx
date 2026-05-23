'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function CriarLojaInner() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [plano, setPlano] = useState<'free' | 'basic' | 'pro'>('free')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [showCancelledInfo, setShowCancelledInfo] = useState(cancelled)

  useEffect(() => {
    if (cancelled) setShowCancelledInfo(true)
  }, [cancelled])

  function handleNome(valor: string) {
    setNome(valor)
    if (!slugEditado) {
      setSlug(slugify(valor))
    }
  }

  function handleSlug(valor: string) {
    setSlugEditado(true)
    setSlug(slugify(valor))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) { setErro('Informe o nome do restaurante.'); return }
    if (!slug.trim()) { setErro('Informe o endereço do cardápio.'); return }
    if (slug.length < 3)  { setErro('O endereço deve ter ao menos 3 caracteres.'); return }

    setLoading(true)

    try {
      if (plano === 'free') {
        // Fluxo gratuito: cria restaurante diretamente
        const res = await fetch('/api/restaurants/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantName: nome, slug }),
        })
        const data = await res.json()
        if (!res.ok) {
          setErro(data.error || 'Erro ao criar restaurante.')
          setLoading(false)
          return
        }
        // Vai para /conta para configurar senha ADM antes de entrar no painel
        window.location.href = '/conta'
        return
      }

      // Fluxo pago: Stripe
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: nome, slug, plan: plano }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao iniciar pagamento.')
        setLoading(false)
        return
      }

      // Redireciona para o checkout do Stripe
      window.location.href = data.url
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 px-5 py-14 max-w-sm mx-auto w-full">

      {/* Progresso */}
      <div className="flex items-center gap-2 mb-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm">1</div>
          <span className="text-sm font-bold text-gray-900">Seu cardápio</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-black text-sm">2</div>
          <span className="text-sm text-gray-400">Pagamento</span>
        </div>
      </div>

      {/* Banner de pagamento cancelado */}
      {showCancelledInfo && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Pagamento não concluído</p>
            <p className="text-amber-700 text-sm mt-0.5">
              O pagamento foi cancelado. Preencha os dados e tente novamente quando quiser.
            </p>
          </div>
          <button onClick={() => setShowCancelledInfo(false)} className="text-amber-400 hover:text-amber-600">✕</button>
        </div>
      )}

      <h1 className="font-display text-3xl font-bold text-gray-950 mb-2 tracking-tight">
        Criar novo cardápio
      </h1>
      <p className="text-base text-gray-500 mb-8 leading-relaxed">
        Preencha as informações do seu cardápio. Você será redirecionado para o pagamento.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nome */}
        <div>
          <label className="block text-base font-bold text-gray-900 mb-2">
            Nome do restaurante
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => handleNome(e.target.value)}
            placeholder="Ex: Restaurante do João"
            className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            disabled={loading}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-base font-bold text-gray-900 mb-2">
            Endereço do cardápio
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-orange-400">
            <span className="px-3 py-3.5 text-sm text-gray-400 border-r border-gray-200 bg-gray-100 whitespace-nowrap">
              hivi-web.com/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlug(e.target.value)}
              placeholder="restaurante-do-joao"
              className="flex-1 px-3 py-3.5 text-base bg-transparent focus:outline-none"
              disabled={loading}
            />
          </div>
          <p className="text-sm text-gray-400 mt-1.5">
            Apenas letras minúsculas, números e hífens.
          </p>
        </div>

        {/* Seletor de plano */}
        <div>
          <p className="block text-base font-bold text-gray-900 mb-3">Escolha seu plano</p>
          <div className="space-y-3">
            {/* Plano Gratuito */}
            <button
              type="button"
              onClick={() => setPlano('free')}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                plano === 'free'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    plano === 'free' ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {plano === 'free' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                  <span className="font-bold text-gray-900">Plano Gratuito</span>
                </div>
                <span className="font-black text-gray-700">Grátis<span className="text-xs font-medium text-gray-400">/mês</span></span>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                16 pratos, 4 categorias, 1 grupo de adicionais por prato, equipe de até 4 pessoas.
              </p>
              <p className="text-xs text-orange-600 font-semibold ml-6 mt-1">
                Experimente 7 dias com tudo do Pro gratuitamente!
              </p>
            </button>

            {/* Plano Básico */}
            <button
              type="button"
              onClick={() => setPlano('basic')}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                plano === 'basic'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    plano === 'basic' ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {plano === 'basic' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                  <span className="font-bold text-gray-900">Plano Básico</span>
                </div>
                <span className="font-black text-orange-500">R$ 59,99<span className="text-xs font-medium text-gray-400">/mês</span></span>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Cardápio digital, QR code de mesa, pedidos, equipe, temas e configurações.
              </p>
            </button>

            {/* Plano Pro */}
            <button
              type="button"
              onClick={() => setPlano('pro')}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                plano === 'pro'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    plano === 'pro' ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {plano === 'pro' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </div>
                  <span className="font-bold text-gray-900">Plano Pro</span>
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Recomendado</span>
                </div>
                <span className="font-black text-orange-500">R$ 99,99<span className="text-xs font-medium text-gray-400">/mês</span></span>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Tudo do Básico + <strong className="text-gray-700">Analytics completo</strong>: gráficos de receita, top produtos, horário de pico e exportação CSV.
              </p>
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-base font-medium">{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !nome || !slug}
          className="w-full py-4 bg-orange-500 text-white font-black text-lg rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? (plano === 'free' ? 'Criando cardápio...' : 'Redirecionando...')
            : (plano === 'free' ? 'Criar cardápio grátis →' : 'Ir para o pagamento →')}
        </button>

        {plano !== 'free' && (
          <p className="text-center text-sm text-gray-400">
            Você será redirecionado para o Stripe, ambiente seguro de pagamento.
          </p>
        )}
      </form>
    </main>
  )
}

export default function CriarLojaPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <Link href="/" translate="no" className="text-2xl font-black tracking-[0.06em] text-gray-950 select-none">
          HIVI
        </Link>
        <Link href="/conta" className="text-base font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Minha conta
        </Link>
      </header>

      <Suspense fallback={
        <main className="flex-1 px-5 py-14 max-w-sm mx-auto w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded-xl" />
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-orange-50 rounded-2xl" />
            <div className="h-14 bg-orange-200 rounded-2xl" />
          </div>
        </main>
      }>
        <CriarLojaInner />
      </Suspense>

    </div>
  )
}
