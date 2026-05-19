import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import { ScanLine, Smartphone, UtensilsCrossed, UserPlus, Settings, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Como funciona
        </h1>
        <p className="text-center text-base text-gray-500 mb-14 leading-relaxed">
          Do cadastro ao primeiro pedido em menos de 1 hora.
        </p>

        {/* Para o restaurante */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-sm font-bold text-orange-500 uppercase tracking-wider">Para o restaurante</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="space-y-8">
            {[
              {
                icon: UserPlus,
                step: '1',
                title: 'Crie sua conta',
                desc: 'Acesse hivi-web.com, clique em "Criar conta" e entre com o Google. Em seguida, escolha o Plano Básico e conclua o pagamento via cartão.',
              },
              {
                icon: Settings,
                step: '2',
                title: 'Configure seu cardápio',
                desc: 'No painel administrativo, adicione as categorias do seu menu (Entradas, Pratos, Bebidas…), cadastre os pratos com foto, descrição e preço.',
              },
              {
                icon: Share2,
                step: '3',
                title: 'Publique e coloque nas mesas',
                desc: 'Acesse Configurações → QR Code da loja, baixe o QR code em PNG, imprima e coloque em cada mesa. Seu cardápio já está no ar.',
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-5">
                <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-md">
                  {s.step}
                </div>
                <div className="pt-1">
                  <p className="font-black text-xl text-gray-900">{s.title}</p>
                  <p className="text-base text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Para o cliente */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-sm font-bold text-orange-500 uppercase tracking-wider">Para o cliente</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="space-y-8">
            {[
              {
                icon: ScanLine,
                step: '1',
                title: 'Escaneia o QR code',
                desc: 'O cliente chega à mesa, aponta a câmera do celular para o QR code e o cardápio abre instantaneamente no navegador. Sem baixar nada.',
              },
              {
                icon: Smartphone,
                step: '2',
                title: 'Navega e escolhe',
                desc: 'Vê as categorias, fotos dos pratos, descrições e preços. Adiciona os itens ao carrinho no próprio ritmo, sem pressa.',
              },
              {
                icon: UtensilsCrossed,
                step: '3',
                title: 'Faz o pedido',
                desc: 'Clica em "Gerar QR Code" e mostra a tela ao garçom, que confirma o pedido no painel. O pedido entra na fila da cozinha automaticamente.',
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-5">
                <div className="w-14 h-14 bg-gray-800 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-md">
                  {s.step}
                </div>
                <div className="pt-1">
                  <p className="font-black text-xl text-gray-900">{s.title}</p>
                  <p className="text-base text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 text-center">
          <p className="font-black text-2xl text-gray-900 mb-2">Pronto para começar?</p>
          <p className="text-base text-gray-500 mb-6">Crie sua conta e tenha seu cardápio online hoje mesmo.</p>
          <Link
            href="/criar-conta"
            className="inline-block px-10 py-4 bg-orange-500 text-white font-black rounded-2xl text-lg hover:bg-orange-600 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
