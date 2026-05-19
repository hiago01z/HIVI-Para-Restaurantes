import Link from 'next/link'
import { ExternalLink, LayoutDashboard, Pause, Trash2, Plus, Settings } from 'lucide-react'

export default function ContaPage() {
  const lojas = [
    { nome: 'Restaurante Exemplo', slug: 'restaurante-exemplo', ativo: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-gray-900">
          HIVI
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/conta/configuracoes" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
          <span className="text-sm font-medium text-gray-700">Conta</span>
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
            {lojas.map((loja) => (
              <div key={loja.slug} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{loja.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">hivi.com.br/{loja.slug}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${loja.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {loja.ativo ? 'Ativa' : 'Pausada'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${loja.slug}`}
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
                  <button className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <Pause className="w-4 h-4" />
                    {loja.ativo ? 'Pausar loja' : 'Ativar loja'}
                  </button>
                  <button className="flex items-center justify-center gap-1.5 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Excluir loja
                  </button>
                </div>
              </div>
            ))}

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
              <p className="text-xs text-gray-400 mt-2">Cobrança adicional por loja</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-5 py-6 mt-8">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400 mb-3">
          <Link href="#" className="hover:text-gray-700 transition-colors">Como funciona</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Preços</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">FAQ</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Feedback</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Entrar</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Privacidade</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Termos</Link>
          <Link href="#" className="hover:text-gray-700 transition-colors">Exclusão de dados</Link>
        </nav>
        <p className="text-center text-xs text-gray-400">
          2026 HIVI Tecnologia — Todos os direitos reservados
        </p>
      </footer>

    </div>
  )
}
