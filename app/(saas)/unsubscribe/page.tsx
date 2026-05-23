import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-20 max-w-md mx-auto text-center">
        <div className="text-5xl mb-6">📭</div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">
          Descadastro solicitado
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Recebemos sua solicitação para remover{' '}
          {email ? (
            <strong className="text-gray-700">{decodeURIComponent(email)}</strong>
          ) : (
            'seu e-mail'
          )}{' '}
          da nossa lista de comunicações.
        </p>
        <p className="text-gray-400 text-sm">
          Você ainda pode receber e-mails essenciais relacionados à sua conta
          (faturas, alertas de segurança).
        </p>
        <a
          href="/"
          className="inline-block mt-8 text-sm text-orange-500 hover:underline font-medium"
        >
          ← Voltar para o início
        </a>
      </main>

      <SaasFooter />
    </div>
  )
}
