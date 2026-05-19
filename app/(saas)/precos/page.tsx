import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import Link from 'next/link'

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Preços
        </h1>
        <p className="text-center text-base text-gray-500 mb-12 leading-relaxed">
          Um plano simples, sem surpresas.
        </p>

        {/* Card do plano */}
        <div className="border-2 border-orange-500 rounded-3xl p-8 shadow-xl mb-10">
          <div className="text-center mb-6">
            <span className="bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
              Plano Básico
            </span>
          </div>
          <div className="text-center mb-8">
            <div>
              <span className="text-6xl font-black text-gray-900">R$&nbsp;59</span>
              <span className="text-3xl font-black text-gray-900">,99</span>
            </div>
            <span className="text-base text-gray-400 mt-1 block">por mês &bull; cancele quando quiser</span>
          </div>

          <ul className="text-base text-gray-700 space-y-4 mb-8">
            {[
              'Cardápio digital público com link e QR code',
              'Painel administrativo completo',
              'QR code de mesa para pedidos',
              'Gestão de pedidos de mesa em tempo real',
              'Categorias e pratos ilimitados',
              'Upload de fotos para os pratos',
              'Suporte via WhatsApp',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="text-orange-500 font-black text-xl flex-shrink-0 leading-tight">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/criar-conta"
            className="block w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-lg text-center hover:bg-orange-600 transition-colors"
          >
            Contratar agora
          </Link>
          <p className="text-center text-sm text-gray-400 mt-3">
            Sem fidelidade &bull; Cancele quando precisar
          </p>
        </div>

        {/* FAQ de billing */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Dúvidas sobre o plano</h2>
          <div className="space-y-4">
            {[
              {
                q: 'A cobrança é mensal?',
                a: 'Sim. A assinatura é mensal e renovada automaticamente todo mês no cartão cadastrado.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Sem multa e sem período mínimo. Ao cancelar, seu cardápio fica ativo até o fim do período pago.',
              },
              {
                q: 'Posso ter mais de um restaurante?',
                a: 'Sim. Cada restaurante é um plano separado. Gerencie todos a partir da mesma conta HIVI.',
              },
              {
                q: 'Quais formas de pagamento são aceitas?',
                a: 'Cartão de crédito e débito pelas principais bandeiras (Visa, Mastercard, Elo, Amex).',
              },
              {
                q: 'Emitem nota fiscal?',
                a: 'Sim. A nota fiscal é emitida automaticamente e enviada por e-mail após cada cobrança.',
              },
            ].map((f) => (
              <div key={f.q} className="bg-gray-50 rounded-2xl p-5">
                <p className="font-bold text-gray-900 text-lg">{f.q}</p>
                <p className="text-gray-500 text-base mt-2 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
