import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

const faqs = [
  {
    categoria: 'Geral',
    itens: [
      { q: 'O que é a HIVI?', a: 'A HIVI é uma plataforma de cardápio digital para restaurantes. Com ela, seu cliente escaneia um QR code na mesa, vê o cardápio no celular e faz o pedido sem precisar chamar o garçom.' },
      { q: 'Preciso instalar algum programa?', a: 'Não. Tudo funciona pelo navegador, tanto para o dono do restaurante quanto para os clientes. Não há download de aplicativo.' },
      { q: 'Funciona em qualquer celular?', a: 'Sim. O cardápio abre em qualquer smartphone com câmera e acesso à internet, independente do sistema (Android ou iOS).' },
    ],
  },
  {
    categoria: 'Cardápio e pedidos',
    itens: [
      { q: 'Como os clientes acessam o cardápio?', a: 'Escaneando o QR code impresso na mesa ou acessando diretamente o link do restaurante (hivi-web.com/seu-restaurante).' },
      { q: 'Posso ter quantos pratos e categorias quiser?', a: 'Sim. Não há limite de categorias nem de pratos cadastrados no plano.' },
      { q: 'Posso colocar fotos nos pratos?', a: 'Sim. Cada prato pode ter uma foto em alta qualidade. As imagens são armazenadas com segurança na nuvem.' },
      { q: 'Como funciona o pedido de mesa?', a: 'O cliente monta o carrinho e gera um QR code na tela. O garçom escaneia esse QR code no painel administrativo, confirma o pedido e ele entra na fila automaticamente.' },
    ],
  },
  {
    categoria: 'Painel administrativo',
    itens: [
      { q: 'Quem pode acessar o painel administrativo?', a: 'O dono do restaurante e os funcionários cadastrados (admins e garçons). Cada um tem um nível de acesso diferente.' },
      { q: 'Posso adicionar funcionários?', a: 'Sim. Em Configurações → Funcionários você pode convidar funcionários por e-mail e definir a função de cada um.' },
      { q: 'Consigo ver os pedidos em tempo real?', a: 'Sim. O painel de pedidos atualiza automaticamente sempre que um novo pedido chega.' },
      { q: 'Posso personalizar as cores e o logo do cardápio?', a: 'Sim. Em Configurações → Temas você altera cores, fontes, logo e banner do cardápio público do seu restaurante.' },
    ],
  },
  {
    categoria: 'Plano e pagamento',
    itens: [
      { q: 'Qual é o preço?', a: 'O Plano Básico custa R$ 59,99 por mês, cobrado mensalmente no cartão de crédito.' },
      { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem multa e sem período de fidelidade mínimo. O cardápio continua ativo até o fim do período pago.' },
      { q: 'Posso ter mais de um restaurante?', a: 'Sim. Cada restaurante é uma assinatura separada. Você gerencia todos pela mesma conta HIVI.' },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          FAQ
        </h1>
        <p className="text-center text-base text-gray-500 mb-12 leading-relaxed">
          Perguntas frequentes sobre a HIVI.
        </p>

        <div className="space-y-12">
          {faqs.map((grupo) => (
            <div key={grupo.categoria}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-sm font-bold text-orange-500 uppercase tracking-wider">
                  {grupo.categoria}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="space-y-4">
                {grupo.itens.map((item) => (
                  <div key={item.q} className="bg-gray-50 rounded-2xl p-5">
                    <p className="font-bold text-gray-900 text-lg">{item.q}</p>
                    <p className="text-gray-500 text-base mt-2 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
