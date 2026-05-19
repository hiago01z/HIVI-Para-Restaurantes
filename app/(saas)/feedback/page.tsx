import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-lg mx-auto">
        <h1 className="text-4xl font-black uppercase text-gray-900 text-center mb-3">
          Feedback
        </h1>
        <p className="text-center text-base text-gray-500 mb-12 leading-relaxed">
          Sua opinião nos ajuda a melhorar. Conta pra gente o que achou.
        </p>

        <form className="space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Nome
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Tipo de feedback
            </label>
            <select className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 text-gray-700">
              <option value="">Selecione...</option>
              <option value="sugestao">Sugestão de melhoria</option>
              <option value="bug">Reportar um problema</option>
              <option value="elogio">Elogio</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Mensagem
            </label>
            <textarea
              rows={5}
              placeholder="Escreva aqui sua mensagem..."
              className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-orange-500 text-white font-black text-lg rounded-2xl hover:bg-orange-600 transition-colors"
          >
            Enviar feedback
          </button>
        </form>

        <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-base text-gray-600 leading-relaxed">
            Prefere falar diretamente? Entre em contato pelo WhatsApp.
          </p>
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-xl text-base hover:bg-green-600 transition-colors"
          >
            Abrir WhatsApp
          </a>
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
