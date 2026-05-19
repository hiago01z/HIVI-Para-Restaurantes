import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ContaActions } from './_conta-actions'

export default async function ContaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar')

  const { data: restaurantes } = await supabase
    .from('restaurants')
    .select('id, name, slug, is_active, stripe_customer_id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const lojas = restaurantes ?? []
  const temStripe = lojas.some((l) => l.stripe_customer_id)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-gray-900">
          HIVI
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block truncate max-w-40">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="px-5 py-8 max-w-lg mx-auto">

        {/* Minhas lojas */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black text-gray-900">Minhas lojas</h1>
          <Link
            href="/criar-loja"
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova loja
          </Link>
        </div>

        {lojas.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-7 h-7 text-orange-500" />
            </div>
            <p className="font-bold text-gray-900 mb-1">Nenhuma loja ainda</p>
            <p className="text-sm text-gray-500 mb-5">Crie sua primeira loja e comece a receber pedidos.</p>
            <Link
              href="/criar-loja"
              className="inline-block px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors"
            >
              Criar minha loja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <ContaActions lojas={lojas} />

            {/* Adicionar mais */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-500 mb-3">Quer adicionar mais um restaurante?</p>
              <Link
                href="/criar-loja"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar loja
              </Link>
              <p className="text-xs text-gray-400 mt-2">R$ 59,99/mês por loja adicional</p>
            </div>
          </div>
        )}

        {/* Billing */}
        {temStripe && (
          <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-black text-gray-900 mb-1">Assinatura</h2>
            <p className="text-sm text-gray-500 mb-4">Gerencie pagamentos, faturas e cancele pelo portal Stripe.</p>
            <ContaActions lojas={[]} showPortalOnly />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white px-5 py-6 mt-8">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400 mb-3">
          <Link href="/como-funciona" className="hover:text-gray-700 transition-colors">Como funciona</Link>
          <Link href="/precos" className="hover:text-gray-700 transition-colors">Preços</Link>
          <Link href="/faq" className="hover:text-gray-700 transition-colors">FAQ</Link>
          <Link href="/feedback" className="hover:text-gray-700 transition-colors">Feedback</Link>
          <Link href="/privacidade" className="hover:text-gray-700 transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-gray-700 transition-colors">Termos</Link>
        </nav>
        <p className="text-center text-xs text-gray-400">
          2026 HIVI Tecnologia — Todos os direitos reservados
        </p>
      </footer>
    </div>
  )
}
