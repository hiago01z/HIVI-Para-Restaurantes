import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Termos de uso
        </h1>
        <p className="text-center text-sm text-gray-400 mb-12">
          Última atualização: maio de 2026
        </p>

        <div className="space-y-10 text-base text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta na HIVI, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. O serviço</h2>
            <p>
              A HIVI oferece uma plataforma de cardápio digital para restaurantes, incluindo painel administrativo, gestão de pedidos e geração de QR codes. O serviço é prestado mediante assinatura mensal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Conta e responsabilidades</h2>
            <ul className="space-y-2">
              {[
                'Você é responsável por manter as credenciais de acesso em sigilo.',
                'Você é responsável pelas informações cadastradas no cardápio (preços, disponibilidade, fotos).',
                'É proibido usar a plataforma para fins ilícitos ou que violem direitos de terceiros.',
                'Cada restaurante cadastrado requer uma assinatura ativa.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Pagamento e cancelamento</h2>
            <ul className="space-y-2">
              {[
                'A assinatura é cobrada mensalmente no cartão de crédito informado.',
                'O cancelamento pode ser feito a qualquer momento sem multa.',
                'Ao cancelar, o cardápio permanece ativo até o fim do período pago.',
                'Não há reembolso de períodos já pagos, exceto por falha técnica comprovada.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Disponibilidade do serviço</h2>
            <p>
              A HIVI se esforça para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas previamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Propriedade intelectual</h2>
            <p>
              Todo o conteúdo da plataforma (código, design, marca) pertence à HIVI Tecnologia. O conteúdo do cardápio (fotos, textos, preços) pertence ao restaurante cadastrado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Limitação de responsabilidade</h2>
            <p>
              A HIVI não se responsabiliza por perdas decorrentes de indisponibilidade do serviço, erros nas informações cadastradas pelo restaurante, ou problemas de conectividade do cliente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">8. Alterações nos termos</h2>
            <p>
              Podemos atualizar estes termos a qualquer momento. O uso continuado da plataforma após a publicação de novas versões implica aceitação das mudanças.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">9. Proteção de dados (LGPD)</h2>
            <p>
              O tratamento dos seus dados pessoais está descrito em nossa{' '}
              <a href="/privacidade" className="text-orange-500 hover:underline font-medium">Política de Privacidade</a>,
              em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              Para exercer seus direitos como titular de dados ou contatar nosso encarregado (DPO),
              envie um e-mail para{' '}
              <a href="mailto:privacidade@hivi-web.com" className="text-orange-500 hover:underline font-medium">privacidade@hivi-web.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">10. Contato</h2>
            <p>
              Dúvidas sobre os termos? Entre em contato: <a href="mailto:support@hivi-web.com" className="text-orange-500 hover:underline font-medium">support@hivi-web.com</a>
            </p>
          </section>

        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
