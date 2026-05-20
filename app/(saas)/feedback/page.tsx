'use client'

import { useState } from 'react'
import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: '', email: '', type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim()) { setError('Informe seu e-mail.'); return }
    if (!form.type) { setError('Selecione o tipo de feedback.'); return }
    if (form.message.trim().length < 10) { setError('Mensagem muito curta (mínimo 10 caracteres).'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || 'Anônimo',
          email: form.email.trim(),
          type: form.type,
          message: form.message.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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

        {sent ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Mensagem enviada!</h2>
            <p className="text-gray-500">Obrigado pelo seu feedback. Em breve entraremos em contato.</p>
            <button
              onClick={() => { setSent(false); setForm({ name: '', email: '', type: '', message: '' }) }}
              className="mt-8 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Enviar outro feedback
            </button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">E-mail *</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Tipo de feedback *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
                className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 text-gray-700"
              >
                <option value="">Selecione...</option>
                <option value="sugestao">Sugestão de melhoria</option>
                <option value="bug">Reportar um problema</option>
                <option value="elogio">Elogio</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Mensagem *</label>
              <textarea
                rows={5}
                placeholder="Escreva aqui sua mensagem..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-500 text-white font-black text-lg rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar feedback'}
            </button>
          </form>
        )}

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
