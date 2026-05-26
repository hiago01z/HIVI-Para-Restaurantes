import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Política de Privacidade
        </h1>
        <p className="text-center text-sm text-gray-400 mb-12">
          Última atualização: maio de 2026
        </p>

        <div className="space-y-10 text-base text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Quem somos</h2>
            <p>
              A HIVI Tecnologia ("HIVI", "nós") é responsável pelo tratamento dos dados pessoais dos
              restaurantes e seus usuários que utilizam a plataforma hivi-web.com. Esta política
              está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. Quais dados coletamos</h2>
            <p className="mb-3">Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>

            <p className="font-semibold text-gray-700 mb-2">Restaurantes (donos e equipe):</p>
            <ul className="mb-4 space-y-2">
              {[
                'Nome e e-mail fornecidos via login com Google.',
                'Dados do restaurante cadastrado (nome, slug, logo, configurações).',
                'Informações de pagamento processadas pelo Stripe (não armazenamos dados de cartão).',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-semibold text-gray-700 mb-2">Clientes finais dos restaurantes:</p>
            <ul className="space-y-2">
              {[
                'Nome informado ao realizar um pedido.',
                'Número de telefone (WhatsApp), quando fornecido em pedidos de entrega.',
                'Endereço de entrega, quando fornecido em pedidos de entrega.',
                'Número da mesa, em pedidos realizados diretamente pela plataforma.',
                'Observações opcionais sobre o pedido.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Base legal e finalidade do tratamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-bold text-gray-800">Finalidade</th>
                    <th className="text-left py-2 font-bold text-gray-800">Base legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Autenticação e acesso à plataforma', 'Execução de contrato (Art. 7º, V)'],
                    ['Processamento e registro de pedidos', 'Execução de contrato (Art. 7º, V)'],
                    ['Envio de notificação WhatsApp ao restaurante', 'Legítimo interesse (Art. 7º, IX)'],
                    ['Envio de e-mails transacionais', 'Execução de contrato (Art. 7º, V)'],
                    ['Análise de comportamento via Meta Pixel', 'Consentimento (Art. 7º, I)'],
                    ['Exibição de anúncios personalizados (Meta)', 'Consentimento (Art. 7º, I)'],
                    ['Melhoria da plataforma e métricas de uso', 'Legítimo interesse (Art. 7º, IX)'],
                  ].map(([finalidade, base]) => (
                    <tr key={finalidade}>
                      <td className="py-2 pr-4 text-gray-600">{finalidade}</td>
                      <td className="py-2 text-gray-600">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Compartilhamento de dados</h2>
            <p className="mb-3">
              Não vendemos dados. Compartilhamos apenas com parceiros técnicos essenciais ao funcionamento
              da plataforma, todos operando como operadores de dados sob nossa instrução:
            </p>
            <ul className="space-y-2">
              {[
                'Supabase — banco de dados, autenticação e armazenamento de arquivos.',
                'Stripe — processamento de pagamentos e assinaturas.',
                'Resend — envio de e-mails transacionais.',
                'Vercel — hospedagem da aplicação web.',
                'UltraMsg — envio de notificações via WhatsApp para restaurantes.',
                'Meta (Facebook) — análise de comportamento e publicidade via Meta Pixel.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Transferência internacional de dados</h2>
            <p>
              Alguns de nossos parceiros técnicos operam servidores fora do Brasil (Estados Unidos e
              União Europeia). Nesses casos, exigimos que adotem medidas de proteção equivalentes às
              previstas na LGPD, como cláusulas contratuais padrão ou certificações reconhecidas
              (ex: EU-US Data Privacy Framework).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Cookies e rastreamento</h2>
            <p className="mb-3">Utilizamos os seguintes tipos de cookies:</p>
            <ul className="space-y-2">
              {[
                'Cookies de sessão — mantêm o usuário autenticado durante o uso da plataforma.',
                'Cookies funcionais — salvam preferências como dados de entrega no dispositivo do cliente.',
                'Cookies analíticos e de publicidade — utilizados pelo Meta Pixel para medir a eficácia de anúncios e exibir publicidade relevante. Você pode recusar pelo Gerenciador de Privacidade do Meta em myprivacy.facebook.com.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Retenção de dados</h2>
            <ul className="space-y-2">
              {[
                'Dados de conta (restaurantes): mantidos enquanto a conta estiver ativa. Após exclusão, removidos em até 30 dias.',
                'Dados de pedidos: mantidos por 5 anos para fins fiscais, contábeis e operacionais, conforme legislação brasileira.',
                'Dados de navegação (Meta Pixel): retidos conforme a política de retenção da Meta, geralmente até 2 anos.',
                'Dados salvos localmente no dispositivo (ex: endereço de entrega): expiram automaticamente após 30 dias.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">8. Seus direitos como titular</h2>
            <p className="mb-3">Nos termos da LGPD (Art. 18), você tem direito a:</p>
            <ul className="space-y-2">
              {[
                'Confirmação — saber se tratamos seus dados.',
                'Acesso — obter uma cópia dos dados que possuímos sobre você.',
                'Correção — corrigir dados incompletos, inexatos ou desatualizados.',
                'Anonimização ou exclusão — solicitar a remoção dos seus dados.',
                'Portabilidade — receber seus dados em formato estruturado.',
                'Revogação do consentimento — para tratamentos baseados em consentimento (ex: Meta Pixel).',
                'Oposição — contestar tratamentos baseados em legítimo interesse.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, acesse sua conta em{' '}
              <a href="/conta" className="text-orange-500 hover:underline font-medium">hivi-web.com/conta</a>{' '}
              ou envie um e-mail para{' '}
              <a href="mailto:privacidade@hivi-web.com" className="text-orange-500 hover:underline font-medium">privacidade@hivi-web.com</a>.
              Responderemos em até 15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">9. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              criptografia em trânsito (TLS/HTTPS), criptografia em repouso no banco de dados,
              Row Level Security (RLS) garantindo que cada restaurante acesse apenas seus próprios dados,
              e controle de acesso por função (owner, manager, waiter, cook, delivery).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">10. Encarregado de dados (DPO)</h2>
            <p>
              Nossa encarregada de dados responsável pelo relacionamento com titulares e com a
              Autoridade Nacional de Proteção de Dados (ANPD) pode ser contatada pelo e-mail{' '}
              <a href="mailto:privacidade@hivi-web.com" className="text-orange-500 hover:underline font-medium">privacidade@hivi-web.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">11. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Alterações relevantes serão comunicadas
              por e-mail ou por aviso na plataforma com antecedência mínima de 10 dias.
              A data de "última atualização" no topo desta página sempre refletirá a versão vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">12. Contato</h2>
            <p>
              Dúvidas sobre privacidade ou proteção de dados? Entre em contato:{' '}
              <a href="mailto:privacidade@hivi-web.com" className="text-orange-500 hover:underline font-medium">privacidade@hivi-web.com</a>
            </p>
          </section>

        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
