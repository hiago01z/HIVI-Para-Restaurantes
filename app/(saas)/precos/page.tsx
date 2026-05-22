import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import Link from 'next/link'

const BASIC_FEATURES = [
  'Cardápio digital público com link e QR code',
  'Painel administrativo completo',
  'QR code de mesa para pedidos',
  'Gestão de pedidos em tempo real',
  'Categorias e pratos ilimitados',
  'Upload de fotos para os pratos',
  'Adicionais e grupos de opções',
  'Impressão térmica (USB, Bluetooth, sistema)',
  'Notificação sonora de novo pedido',
  'Personalização de tema e cores',
  'Gerenciamento de equipe com cargos',
  'Integração WhatsApp automática',
  'Suporte via WhatsApp',
]

const PRO_EXTRAS = [
  'Gráfico de receita por dia (últimos 30 dias)',
  'Top 5 produtos mais vendidos',
  'Pedidos por tipo (mesa vs entrega)',
  'Ticket médio e horário de pico',
  'Comparativo semanal de receita',
  'Exportação de pedidos em CSV',
]

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-3xl mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Preços
        </h1>
        <p className="text-center text-base text-gray-500 mb-12 leading-relaxed">
          Dois planos. Zero taxas sobre pedidos. Cancele quando quiser.
        </p>

        {/* Cards dos planos */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">

          {/* Plano Básico */}
          <div className="border-2 border-gray-200 rounded-3xl p-7">
            <div className="text-center mb-6">
              <span className="bg-gray-100 text-gray-700 text-sm font-bold px-4 py-1.5 rounded-full">
                Plano Básico
              </span>
            </div>
            <div className="text-center mb-7">
              <div>
                <span className="text-5xl font-black text-gray-900">R$&nbsp;59</span>
                <span className="text-2xl font-black text-gray-900">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês &bull; cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-3 mb-8">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/criar-conta"
              className="block w-full py-3.5 border-2 border-orange-500 text-orange-500 font-black rounded-2xl text-base text-center hover:bg-orange-50 transition-colors"
            >
              Contratar Básico
            </Link>
          </div>

          {/* Plano Pro */}
          <div className="border-2 border-orange-500 rounded-3xl p-7 shadow-xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
                Recomendado
              </span>
            </div>
            <div className="text-center mb-6">
              <span className="bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                Plano Pro
              </span>
            </div>
            <div className="text-center mb-7">
              <div>
                <span className="text-5xl font-black text-gray-900">R$&nbsp;99</span>
                <span className="text-2xl font-black text-gray-900">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês &bull; cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-3 mb-6">
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">★</span>
                <span className="font-semibold text-gray-900">Tudo do Plano Básico, mais:</span>
              </li>
              {PRO_EXTRAS.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/criar-conta"
              className="block w-full py-3.5 bg-orange-500 text-white font-black rounded-2xl text-base text-center hover:bg-orange-600 transition-colors"
            >
              Contratar Pro →
            </Link>
            <p className="text-center text-xs text-gray-400 mt-2">Sem fidelidade &bull; Cancele quando precisar</p>
          </div>
        </div>

        {/* Comparativo */}
        <div className="bg-gray-50 rounded-3xl p-6 mb-12">
          <h2 className="text-lg font-black text-gray-900 mb-4 text-center">Analytics em detalhes (exclusivo Pro)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '📈', title: 'Receita por dia', desc: 'Acompanhe o faturamento dia a dia nos últimos 7 ou 30 dias.' },
              { emoji: '🏆', title: 'Top 5 produtos', desc: 'Descubra quais pratos vendem mais e geram mais receita.' },
              { emoji: '⏰', title: 'Horário de pico', desc: 'Saiba em que horário seus pedidos se concentram.' },
              { emoji: '📊', title: 'Comparativo semanal', desc: 'Compare a receita desta semana com a anterior.' },
              { emoji: '🎯', title: 'Ticket médio', desc: 'Quanto cada pedido vale em média no período.' },
              { emoji: '📥', title: 'Exportação CSV', desc: 'Baixe todos os pedidos para análise no Excel/Sheets.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-4">
                <span className="text-2xl mb-2 block">{item.emoji}</span>
                <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ de billing */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Dúvidas sobre os planos</h2>
          <div className="space-y-4">
            {[
              {
                q: 'A cobrança é mensal?',
                a: 'Sim. A assinatura é mensal e renovada automaticamente todo mês no cartão cadastrado.',
              },
              {
                q: 'Posso fazer upgrade de Básico para Pro?',
                a: 'Sim. Em "Minha Conta", basta clicar em "Fazer upgrade para Pro". A diferença é cobrada proporcionalmente no ciclo atual.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Sem multa e sem período mínimo. Ao cancelar, seu cardápio fica ativo até o fim do período pago.',
              },
              {
                q: 'Posso ter mais de um restaurante?',
                a: 'Sim. Cada restaurante é um plano separado (Básico ou Pro). Gerencie todos a partir da mesma conta HIVI.',
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
                <p className="font-bold text-gray-900 text-base">{f.q}</p>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
