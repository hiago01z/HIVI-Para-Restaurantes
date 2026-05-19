import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Privacidade
        </h1>
        <p className="text-center text-sm text-gray-400 mb-12">
          Última atualização: maio de 2026
        </p>

        <div className="space-y-10 text-base text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Quais dados coletamos</h2>
            <p>
              Coletamos apenas os dados necessários para o funcionamento da plataforma:
            </p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Nome e e-mail fornecidos pelo login com Google.',
                'Dados do restaurante cadastrado (nome, slug, configurações).',
                'Dados dos pedidos realizados pelos clientes do restaurante.',
                'Informações de pagamento processadas pelo Stripe (não armazenamos dados de cartão).',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. Como usamos os dados</h2>
            <p>
              Os dados são usados exclusivamente para:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                'Autenticar o acesso à plataforma.',
                'Exibir e gerenciar o cardápio digital do restaurante.',
                'Processar e registrar pedidos.',
                'Enviar e-mails transacionais (confirmações, faturas).',
                'Melhorar a plataforma com base no uso.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Compartilhamento de dados</h2>
            <p>
              Não vendemos nem compartilhamos seus dados com terceiros, exceto com os parceiros técnicos necessários para o funcionamento da plataforma:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                'Supabase — banco de dados e autenticação.',
                'Stripe — processamento de pagamentos.',
                'Resend — envio de e-mails transacionais.',
                'Vercel — hospedagem da aplicação.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-orange-500 font-black flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Cookies</h2>
            <p>
              Utilizamos cookies de sessão para manter o usuário autenticado. Não utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Seus direitos</h2>
            <p>
              Você pode solicitar a qualquer momento a exclusão dos seus dados. Acesse sua conta em hivi.com.br/conta ou envie um e-mail para contato@hivi.com.br.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Segurança</h2>
            <p>
              Todos os dados são armazenados com criptografia. O acesso ao banco de dados é protegido por Row Level Security (RLS), garantindo que cada restaurante só acesse seus próprios dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Contato</h2>
            <p>
              Dúvidas sobre privacidade? Entre em contato: <a href="mailto:contato@hivi.com.br" className="text-orange-500 hover:underline font-medium">contato@hivi.com.br</a>
            </p>
          </section>

        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
