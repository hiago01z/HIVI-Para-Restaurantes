'use client'

import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const FREE_FEATURES = [
  'Cardapio digital publico com link e QR code',
  'Painel administrativo',
  'QR code de mesa para pedidos',
  'Gestao de pedidos em tempo real',
  'Upload de fotos e banners',
  'Ate 16 pratos e 4 categorias',
  '1 grupo de adicionais por prato',
  'Impressao termica (USB, Bluetooth, sistema)',
  'Notificacao sonora de novo pedido',
  'Personalizacao de tema e cores',
  'Equipe de ate 4 pessoas',
]

const BASIC_FEATURES = [
  'Cardapio digital publico com link e QR code',
  'Painel administrativo',
  'QR code de mesa para pedidos',
  'Gestao de pedidos em tempo real',
  'Categorias e pratos ilimitados',
  'Adicionais e grupos de opcoes ilimitados',
  'Upload de fotos para os pratos',
  'Impressao termica (USB, Bluetooth, sistema)',
  'Notificacao sonora de novo pedido',
  'Personalizacao de tema e cores',
  'Equipe ilimitada com cargos',
  'Integracao WhatsApp automatica',
  'Suporte via WhatsApp',
]

const PRO_EXTRAS = [
  'Grafico de receita por dia (ultimos 30 dias)',
  'Top 5 produtos mais vendidos',
  'Pedidos por tipo (mesa vs entrega)',
  'Ticket medio e horario de pico',
  'Comparativo semanal de receita',
  'Exportacao de pedidos em CSV',
]

// Labels com acentos separados para evitar problema de encoding no Write
const LABELS = {
  free_features: [
    'Cardápio digital público com link e QR code',
    'Painel administrativo',
    'QR code de mesa para pedidos',
    'Gestão de pedidos em tempo real',
    'Upload de fotos e banners',
    'Até 16 pratos e 4 categorias',
    '1 grupo de adicionais por prato',
    'Impressão térmica (USB, Bluetooth, sistema)',
    'Notificação sonora de novo pedido',
    'Personalização de tema e cores',
    'Equipe de até 4 pessoas',
  ],
  basic_features: [
    'Cardápio digital público com link e QR code',
    'Painel administrativo',
    'QR code de mesa para pedidos',
    'Gestão de pedidos em tempo real',
    'Categorias e pratos ilimitados',
    'Adicionais e grupos de opções ilimitados',
    'Upload de fotos para os pratos',
    'Impressão térmica (USB, Bluetooth, sistema)',
    'Notificação sonora de novo pedido',
    'Personalização de tema e cores',
    'Equipe ilimitada com cargos',
    'Integração WhatsApp automática',
    'Suporte via WhatsApp',
  ],
  pro_extras: [
    'Gráfico de receita por dia (últimos 30 dias)',
    'Top 5 produtos mais vendidos',
    'Pedidos por tipo (mesa vs entrega)',
    'Ticket médio e horário de pico',
    'Comparativo semanal de receita',
    'Exportação de pedidos em CSV',
  ],
}

type Locale = 'BR' | 'PT'

const PRICING: Record<Locale, {
  basic: { label: string; cents: string }
  pro:   { label: string; cents: string }
  faq_payment: string
  faq_cancel: string
}> = {
  BR: {
    basic: { label: 'R$ 59', cents: ',99' },
    pro:   { label: 'R$ 99', cents: ',99' },
    faq_payment: 'Cartão de crédito e débito pelas principais bandeiras (Visa, Mastercard, Elo, Amex).',
    faq_cancel:  'Ao cancelar, seu cardápio fica ativo até o fim do período pago — depois continua no plano gratuito.',
  },
  PT: {
    basic: { label: '24', cents: ',99 €' },
    pro:   { label: '39', cents: ',99 €' },
    faq_payment: 'Cartão de crédito e débito (Visa, Mastercard). MB Way e Multibanco em breve.',
    faq_cancel:  'Ao cancelar, o seu menu fica ativo até ao fim do período pago — depois continua no plano gratuito.',
  },
}

/** Detecta se o browser do visitante usa locale europeu */
function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'BR'
  const lang = navigator.language ?? ''
  // pt-PT, pt, e qualquer locale europeu (fr, de, es-ES, it, nl...)
  if (lang.startsWith('pt-PT') || lang.startsWith('pt-PT')) return 'PT'
  // Qualquer locale europeu que nao seja pt-BR
  const euPrefixes = ['fr', 'de', 'it', 'nl', 'es-ES', 'pl', 'ro', 'hu', 'cs', 'el', 'sv', 'da', 'fi', 'no', 'sk', 'hr', 'bg', 'et', 'lv', 'lt', 'sl', 'ga', 'mt']
  if (euPrefixes.some((p) => lang.startsWith(p))) return 'PT'
  // pt sem sufixo: ambiguo, usa BR como padrao
  return 'BR'
}

export default function PrecosPage() {
  const [locale, setLocale] = useState<Locale>('BR')
  const [detected, setDetected] = useState(false)

  // Auto-detecta na montagem (client-only)
  useEffect(() => {
    if (!detected) {
      setLocale(detectLocale())
      setDetected(true)
    }
  }, [detected])

  const p = PRICING[locale]

  return (
    <div className="min-h-screen bg-white">
      <SaasHeader />

      <main className="px-5 py-14 max-w-5xl mx-auto">

        <p className="text-center text-xs font-bold tracking-[0.2em] uppercase text-orange-500 mb-3">
          Simples e Transparente
        </p>
        <h1 className="font-display text-4xl font-bold text-gray-950 text-center mb-3 tracking-tight">
          Preços
        </h1>
        <p className="text-center text-base text-gray-500 mb-6 leading-relaxed">
          Comece grátis. Sem cartão de crédito. Todo plano inclui 7 dias com tudo do Pro.
        </p>

        {/* Toggle de localização */}
        <div className="flex items-center justify-center gap-1 mb-12">
          <button
            onClick={() => setLocale('BR')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors border-2 ${
              locale === 'BR'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            🇧🇷 Brasil
          </button>
          <button
            onClick={() => setLocale('PT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors border-2 ${
              locale === 'PT'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            🇵🇹 Portugal
          </button>
        </div>

        {/* Cards dos planos */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">

          {/* Plano Gratuito */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            <div className="text-center mb-6">
              <span className="font-display text-base italic text-gray-500">Plano Gratuito</span>
            </div>
            <div className="text-center mb-7">
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-black text-gray-900 leading-none">Grátis</span>
              </div>
              <span className="text-sm text-gray-400 mt-2 block">para sempre · sem cartão</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-3 mb-8 flex-1">
              {LABELS.free_features.map((f) => (
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
              Começar grátis
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              🎉 7 dias com tudo do Pro grátis ao criar
            </p>
          </div>

          {/* Plano Básico */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            <div className="text-center mb-6">
              <span className="font-display text-base italic text-gray-500">Plano Básico</span>
            </div>
            <div className="text-center mb-7">
              <div>
                <span className="text-5xl font-black text-gray-900">{p.basic.label}</span>
                <span className="text-2xl font-black text-gray-900">{p.basic.cents}</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês · cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-3 mb-8 flex-1">
              {LABELS.basic_features.map((f) => (
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
          <div className="border-2 border-orange-500 rounded-3xl p-7 shadow-xl relative flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
                Recomendado
              </span>
            </div>
            <div className="text-center mb-6">
              <span className="font-display text-base italic text-orange-500">Plano Pro</span>
            </div>
            <div className="text-center mb-7">
              <div>
                <span className="text-5xl font-black text-gray-900">{p.pro.label}</span>
                <span className="text-2xl font-black text-gray-900">{p.pro.cents}</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block">por mês · cancele quando quiser</span>
            </div>

            <ul className="text-sm text-gray-700 space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">★</span>
                <span className="font-semibold text-gray-900">Tudo do Básico, mais:</span>
              </li>
              {LABELS.pro_extras.map((f) => (
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
            <p className="text-center text-xs text-gray-400 mt-2">Sem fidelidade · Cancele quando precisar</p>
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
                q: 'O plano gratuito é realmente grátis para sempre?',
                a: 'Sim. O plano gratuito não tem prazo de expiração. Você pode usar 16 pratos, 4 categorias, 1 grupo de adicionais por prato, upload de fotos, impressão térmica e equipe de até 4 pessoas indefinidamente.',
              },
              {
                q: 'O que são os 7 dias grátis do Pro?',
                a: 'Ao criar qualquer cardápio (inclusive no plano gratuito), você tem 7 dias com acesso completo ao Pro. Após esse período, volta automaticamente para as limitações do seu plano. Nenhum dado é deletado.',
              },
              {
                q: 'A cobrança é mensal?',
                a: 'Sim. A assinatura é mensal e renovada automaticamente todo mês no cartão cadastrado.',
              },
              {
                q: 'Posso fazer upgrade do plano gratuito para Básico ou Pro?',
                a: 'Sim. Em "Minha Conta", clique em "Básico" ou "Pro ★" no seu cardápio. Você será redirecionado para o Stripe para assinar.',
              },
              {
                q: 'Posso fazer upgrade de Básico para Pro?',
                a: 'Sim. Em "Minha Conta", basta clicar em "Fazer upgrade para Pro". O plano muda imediatamente.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: p.faq_cancel,
              },
              {
                q: 'Posso ter mais de um cardápio?',
                a: 'Sim. Cada cardápio tem seu próprio plano. Gerencie todos a partir da mesma conta HIVI.',
              },
              {
                q: 'Quais formas de pagamento são aceitas?',
                a: p.faq_payment,
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
