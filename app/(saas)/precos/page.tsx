import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import Link from 'next/link'

const FREE_FEATURES = [
  'Cardápio digital público com link e QR code',
  'Painel administrativo completo',
  'QR code de mesa para pedidos',
  'Gestão de pedidos em tempo real',
  'Até 16 pratos e 4 categorias',
  '1 grupo de adicionais por prato',
  'Equipe de até 4 pessoas',
  'Personalização de tema e cores',
]

const FREE_LIMITS = [
  'Sem integração WhatsApp automática',
  'Sem Analytics',
]

const BASIC_FEATURES = [
  'Cardápio digital público com link e QR code',
  'Painel administrativo completo',
  'QR code de mesa para pedidos',
  'Gestão de pedidos em tempo real',
  'Categorias e pratos ilimitados',
  'Adicionais e grupos de opções ilimitados',
  'Equipe ilimitada com cargos',
  'Upload de fotos para os pratos',
  'Impressão térmica (USB, Bluetooth, sistema)',
  'Notificação sonora de novo pedido',
  'Personalização de tema e cores',
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

      <main className="px-5 py-14 max-w-5xl mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Preços
        </h1>
        <p className="text-center text-base text-gray-500 mb-12 leading-relaxed">
          Comece grátis. Assine quando precisar de mais. Zero taxas sobre pedidos.
        </p>

        {/* Cards dos planos */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">

          {/* Plano Gratuito */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            {/* Trial badge */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5 mb-5 text-center">
              <p className="text-xs font-black text-green-700 uppercase tracking-wide">🎉 Trial incluso</p>
              <p className="text-sm font-semibold text-green-800 mt-0.5">7 dias com tudo do Pro grátis</p>
            </div>

            <div className="text-center mb-5">
              <span className="bg-gray-100 text-gray-700 text-sm font-bold px-4 py-1.5 rounded-full">
                Plano Gratuito
              </span>
            </div>
            <div className="text-center mb-6">
              <div>
                <span className="text-5xl font-black text-gray-900">R$&nbsp;0</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">para sempre grátis</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-2.5 mb-4 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-green-500 font-black flex-shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
              {FREE_LIMITS.map((f) => (
                <li key={f} className="flex items-start gap-2.5 opacity-50">
                  <span className="font-black flex-shrink-0 mt-0.5 text-gray-400">✗</span>
                  <span className="line-through text-gray-400">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/criar-conta"
              className="block w-full py-3.5 border-2 border-gray-300 text-gray-700 font-black rounded-2xl text-base text-center hover:bg-gray-50 transition-colors mt-auto"
            >
              Começar grátis →
            </Link>
            <p className="text-center text-xs text-gray-400 mt-2">Sem cartão de crédito</p>
          </div>

          {/* Plano Básico */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            <div className="text-center mb-6 mt-10">
              <span className="bg-gray-100 text-gray-700 text-sm font-bold px-4 py-1.5 rounded-full">
                Plano Básico
              </span>
            </div>
            <div className="text-center mb-6">
              <div>
                <span className="text-5xl font-black text-gray-900">R$&nbsp;59</span>
                <span className="text-2xl font-black text-gray-900">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês &bull; cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-2.5 mb-8 flex-1">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/criar-conta"
              className="block w-full py-3.5 border-2 border-orange-500 text-orange-500 font-black rounded-2xl text-base text-center hover:bg-orange-50 transition-colors mt-auto"
            >
              Contratar Básico
            </Link>
          </div>

          {/* Plano Pro */}
          <div className="border-2 border-orange-500 rounded-3xl p-7 shadow-xl relative flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
                Recomendado
              </span>
            </div>
            <div className="text-center mb-6 mt-4">
              <span className="bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                Plano Pro
              </span>
            </div>
            <div className="text-center mb-6">
              <div>
                <span className="text-5xl font-black text-gray-900">R$&nbsp;99</span>
                <span className="text-2xl font-black text-gray-900">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês &bull; cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-2.5 mb-6 flex-1">
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
              className="block w-full py-3.5 bg-orange-500 text-white font-black rounded-2xl text-base text-center hover:bg-orange-600 transition-colors mt-auto"
            >
              Contratar Pro →
            </Link>
            <p className="text-center text-xs text-gray-400 mt-2">Sem fidelidade &bull; Cancele quando precisar</p>
          </div>
        </div>

        {/* Destaque trial */}
        <div className="bg-gradient-to-r from-green-50 to-orange-50 border border-orange-100 rounded-3xl p-6 mb-12 text-center">
          <p className="text-2xl font-black text-gray-900 mb-2">🎉 Todo plano começa com 7 dias grátis do Pro</p>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Ao criar seu cardápio — seja no plano gratuito ou pago — você experimenta todos os recursos do Pro por 7 dias sem custo. Depois, continua no plano que escolheu.
          </p>
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
                q: 'O plano gratuito é realmente grátis para sempre?',
                a: 'Sim. O plano gratuito não tem prazo de expiração. Você pode usar 16 pratos, 4 categorias, 1 grupo de adicionais por prato e equipe de até 4 pessoas indefinidamente. O que acontece após o trial de 7 dias é que os recursos exclusivos do Pro (Analytics e WhatsApp automático) ficam bloqueados — os demais permanecem funcionando.',
              },
              {
                q: 'O que acontece com os 7 dias grátis do Pro?',
                a: 'Ao criar qualquer cardápio (inclusive no plano gratuito), você tem 7 dias com acesso completo ao Pro. Após esse período, se não assinar, volta automaticamente para as limitações do seu plano. Nenhum prato ou dado é deletado.',
              },
              {
                q: 'A cobrança é mensal?',
                a: 'Sim. A assinatura é mensal e renovada automaticamente todo mês no cartão cadastrado.',
              },
              {
                q: 'Posso fazer upgrade de Básico para Pro?',
                a: 'Sim. Em "Minha Conta", basta clicar em "Fazer upgrade para Pro". O plano muda imediatamente.',
              },
              {
                q: 'Posso fazer upgrade do plano gratuito para Básico ou Pro?',
                a: 'Sim. Em "Minha Conta", clique em "Básico" ou "Pro ★" no seu cardápio. Você será redirecionado para o Stripe para assinar.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Sem multa e sem período mínimo. Ao cancelar, seu cardápio fica ativo até o fim do período pago — depois continua no plano gratuito.',
              },
              {
                q: 'Posso ter mais de um cardápio?',
                a: 'Sim. Cada cardápio tem seu próprio plano. Gerencie todos a partir da mesma conta HIVI.',
              },
              {
                q: 'Quais formas de pagamento são aceitas?',
                a: 'Cartão de crédito e débito pelas principais bandeiras (Visa, Mastercard, Elo, Amex).',
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
