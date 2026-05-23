import Link from 'next/link'
import { QrCode, Smartphone, TrendingUp, Clock, ScanLine, UtensilsCrossed, CheckCircle2, ChefHat, CheckSquare } from 'lucide-react'
import { SaasHeader } from '@/components/saas/saas-header'
import { SaasFooter } from '@/components/saas/saas-footer'
import { createClient } from '@/lib/supabase/server'
import { HiviLogo } from '@/components/saas/hivi-logo'

export default async function LandingPage() {
  // Busca o primeiro restaurante ativo para a prévia ao vivo
  const supabase = await createClient()
  const { data: demoRestaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (
    <div className="min-h-screen bg-white">

      <SaasHeader />

      {/* ── Hero ── */}
      <section className="bg-gray-50 px-5 pt-14 pb-20 text-center">

        {/* Logo mark grande — identidade da marca no hero */}
        <div className="flex justify-center mb-6">
          <HiviLogo size="lg" className="pointer-events-none" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 mb-4">
          Cardápio digital para restaurantes
        </p>
        <h1 className="font-display text-[3.25rem] font-bold leading-[1.05] tracking-tight text-gray-950 mb-5">
          Cardápio<br /><em>Online</em>
        </h1>
        <p className="text-[1.0625rem] text-gray-600 mb-10 max-w-xs mx-auto leading-relaxed">
          QR code nas mesas, pedidos em tempo real e painel completo para o seu restaurante.
        </p>

        {/* Mockup do app — iframe ao vivo ou fallback estático */}
        <div className="mb-12 flex justify-center">
          {demoRestaurant ? (
            /* ── Phone frame com iframe do cardápio real ── */
            <div
              style={{
                width: '252px',
                background: '#111827',
                border: '6px solid #111827',
                borderRadius: '2.5rem',
                padding: '14px 0 10px',
                position: 'relative',
                boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
              }}
            >
              {/* Notch */}
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '80px', height: '20px',
                background: '#111827',
                borderRadius: '0 0 12px 12px',
                zIndex: 10,
              }} />
              {/* Tela */}
              <div style={{
                width: '240px',
                height: '520px',
                overflow: 'hidden',
                borderRadius: '1.5rem',
                position: 'relative',
                background: '#000',
              }}>
                <iframe
                  src={`/${demoRestaurant.slug}`}
                  title="Demonstração do cardápio"
                  style={{
                    width: '390px',
                    height: '844px',
                    transform: 'scale(0.6154)',
                    transformOrigin: 'top left',
                    border: 'none',
                    pointerEvents: 'none',
                    display: 'block',
                  }}
                />
                {/* Overlay para bloquear interação */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 5 }} />
              </div>
              {/* Home indicator */}
              <div style={{
                width: '72px', height: '4px',
                background: 'rgba(255,255,255,0.22)',
                borderRadius: '2px',
                margin: '10px auto 0',
              }} />
            </div>
          ) : (
            /* ── Fallback estático quando não há restaurante ativo ── */
            <div className="w-60 bg-[#2C1A0E] rounded-3xl p-2.5 shadow-2xl">
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-[#2C1A0E] flex items-center gap-2 px-3 pt-3 pb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-black text-sm">B</span>
                  </div>
                  <div className="flex-1 h-7 bg-[#3D2110] rounded-full" />
                  <div className="w-7 h-7 bg-[#3D2110] rounded-full" />
                  <div className="w-7 h-7 bg-[#3D2110] rounded-full" />
                </div>
                <div className="bg-[#2C1A0E] px-3 pb-1">
                  <div className="w-full aspect-square bg-[#3D2110] rounded-2xl mb-2 flex items-center justify-center">
                    <span className="text-5xl opacity-30">🥩</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {['Combos 🍔','Completo 🍽️','Bebidas 🥤','Especiais ⭐'].map((c) => (
                      <div key={c} className="h-14 bg-[#3D2110] rounded-xl flex items-end p-2">
                        <span className="text-orange-400 text-[10px] font-semibold leading-tight">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/criar-conta"
          className="inline-block px-10 py-4 bg-orange-500 text-white font-semibold tracking-wide rounded-2xl text-lg hover:bg-orange-600 transition-colors shadow-lg"
        >
          Começar agora
        </Link>
        <p className="text-sm text-gray-400 mt-3 font-medium">Sem fidelidade · Cancele quando quiser</p>
      </section>

      {/* ── QR Code nas mesas ── */}
      <section className="px-5 py-16">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mx-auto mb-6">
            <QrCode className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="font-display text-[2rem] font-bold text-gray-950 text-center mb-4 leading-tight">
            Do QR code à cozinha<br />em segundos
          </h2>
          <p className="text-[1.0625rem] text-gray-600 text-center leading-relaxed mb-10">
            Seu cliente escaneia, monta o pedido e mostra ao garçom. Em um clique, o pedido aparece no painel e vai direto para a cozinha.
          </p>

          {/* Fluxo visual */}
          <div className="space-y-3">
            {[
              { icon: ScanLine,        title: '1. Cliente escaneia',       desc: 'O QR code fica impresso na mesa. Basta apontar a câmera — abre na hora, sem aplicativo.' },
              { icon: UtensilsCrossed, title: '2. Monta o pedido',         desc: 'Navega pelo cardápio com fotos, preços e categorias e adiciona o que quiser ao carrinho.' },
              { icon: CheckSquare,     title: '3. Garçom confirma',        desc: 'O cliente mostra o QR code do pedido. O garçom escaneia e confirma em segundos.' },
              { icon: ChefHat,         title: '4. Pedido vai à cozinha',   desc: 'O pedido aparece no painel do ADM em tempo real. Zero erros, zero retrabalho.' },
            ].map((item, i) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl p-4" style={{ background: i === 3 ? '#fff7ed' : '#f9fafb', border: i === 3 ? '1.5px solid #fed7aa' : 'none' }}>
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Destaques rápidos */}
          <div className="mt-8 space-y-2.5">
            {[
              'Sem download de aplicativo',
              'Funciona em qualquer celular',
              'QR code para imprimir grátis',
              'Pedidos chegam em tempo real na cozinha',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700 text-[0.9375rem] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section id="beneficios" className="px-5 py-16 bg-gray-50">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 text-center mb-3">
          Por que escolher a HIVI
        </p>
        <h2 className="font-display text-[2rem] font-bold text-center text-gray-950 mb-10 leading-tight">
          Benefícios
        </h2>
        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { icon: QrCode,     title: 'QR Code nas mesas',  desc: 'Clientes fazem pedidos direto pelo celular, sem esperar o garçom.' },
            { icon: Smartphone, title: 'Cardápio digital',   desc: 'Atualize preços e itens em tempo real, sem custo de impressão.' },
            { icon: TrendingUp, title: 'Mais pedidos',       desc: 'Clientes pedem mais quando navegam sozinhos pelo cardápio.' },
            { icon: Clock,      title: 'Atendimento rápido', desc: 'Pedidos chegam direto para a equipe, sem erros de comunicação.' },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-display font-semibold text-gray-900 text-base">{b.title}</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section id="depoimentos" className="px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 text-center mb-3">
          Clientes satisfeitos
        </p>
        <h2 className="font-display text-[2rem] font-bold text-center text-gray-950 mb-10 leading-tight">
          Quem usa aprova
        </h2>
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { name: 'Carlos Silva',  rest: 'Restaurante Silva', text: 'Depois do HIVI os pedidos aumentaram 30%. Os clientes adoram pedir pelo celular.' },
            { name: 'Ana Ferreira',  rest: 'Cantina Ana',       text: 'Muito fácil de configurar. Em menos de 1 hora já estava funcionando nas mesas.' },
            { name: 'João Oliveira', rest: 'Churrascaria JO',   text: 'Acabou com os erros de pedido. Hoje tudo chega certinho para a cozinha.' },
          ].map((t) => (
            <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="font-display italic text-gray-800 text-[1.0625rem] leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <p className="font-semibold text-sm text-gray-900">{t.name}</p>
              <p className="text-xs text-orange-500 font-medium mt-0.5 uppercase tracking-wide">{t.rest}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="px-5 py-16 bg-gray-50">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 text-center mb-3">
          Em 3 passos
        </p>
        <h2 className="font-display text-[2rem] font-bold text-center text-gray-950 mb-12 leading-tight">
          Como funciona
        </h2>
        <div className="space-y-8 max-w-sm mx-auto">
          {[
            { step: '1', title: 'Crie sua conta',         desc: 'Acesse com o Google e escolha seu plano em menos de 2 minutos.' },
            { step: '2', title: 'Configure seu cardápio', desc: 'Adicione categorias, pratos, fotos e preços no painel administrativo.' },
            { step: '3', title: 'Publique e receba',      desc: 'Imprima o QR code, coloque nas mesas e comece a receber pedidos.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-5">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="font-display font-bold text-2xl italic">{s.step}</span>
              </div>
              <div className="pt-2">
                <p className="font-display font-bold text-xl text-gray-950 leading-tight">{s.title}</p>
                <p className="text-[0.9375rem] text-gray-600 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Preços ── */}
      <section id="precos" className="px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500 text-center mb-3">
          Simples e transparente
        </p>
        <h2 className="font-display text-[2rem] font-bold text-center text-gray-950 mb-10 leading-tight">
          Preços
        </h2>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">

          {/* Plano Gratuito */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            <p className="font-display font-semibold text-gray-500 text-base text-center mb-1 italic">
              Plano Gratuito
            </p>
            <div className="text-center my-5">
              <div>
                <span className="font-display text-5xl font-bold text-gray-950">Grátis</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block font-medium">para sempre · sem cartão</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-2.5 mb-7 flex-1">
              {[
                'Cardápio digital público',
                'Painel administrativo completo',
                'QR code de mesa',
                'Até 16 pratos e 4 categorias',
                '1 grupo de adicionais por prato',
                'Equipe de até 4 pessoas',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-orange-500 font-bold flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/criar-conta"
              className="block w-full py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-2xl text-base text-center hover:bg-orange-50 transition-colors"
            >
              Começar grátis
            </Link>
            <p className="text-center text-xs text-gray-400 mt-2">🎉 7 dias com tudo do Pro ao criar</p>
          </div>

          {/* Plano Básico */}
          <div className="border-2 border-gray-200 rounded-3xl p-7 flex flex-col">
            <p className="font-display font-semibold text-gray-500 text-base text-center mb-1 italic">
              Plano Básico
            </p>
            <div className="text-center my-5">
              <div>
                <span className="font-display text-5xl font-bold text-gray-950">R$&nbsp;59</span>
                <span className="font-display text-xl font-bold text-gray-950">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block font-medium">por mês</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-2.5 mb-7 flex-1">
              {[
                'Cardápio digital público',
                'Painel administrativo completo',
                'QR code de mesa',
                'Adicionais e opções por prato',
                'Impressão térmica',
                'Categorias e pratos ilimitados',
                'Suporte via WhatsApp',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-orange-500 font-bold flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/criar-conta"
              className="block w-full py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-2xl text-base text-center hover:bg-orange-50 transition-colors"
            >
              Contratar Básico
            </Link>
          </div>

          {/* Plano Pro */}
          <div className="border-2 border-orange-500 rounded-3xl p-7 shadow-xl relative flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <p className="font-display font-semibold text-orange-500 text-base text-center mb-1 italic">
              Plano Pro
            </p>
            <div className="text-center my-5">
              <div>
                <span className="font-display text-5xl font-bold text-gray-950">R$&nbsp;99</span>
                <span className="font-display text-xl font-bold text-gray-950">,99</span>
              </div>
              <span className="text-sm text-gray-400 mt-1 block font-medium">por mês</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-2.5 mb-7 flex-1">
              <li className="flex items-center gap-2.5">
                <span className="text-orange-500 font-bold flex-shrink-0">★</span>
                <span className="font-semibold text-gray-800">Tudo do Básico, mais:</span>
              </li>
              {[
                'Analytics: gráfico de receita diária',
                'Top 5 produtos mais vendidos',
                'Ticket médio e horário de pico',
                'Comparativo semanal',
                'Exportação de pedidos em CSV',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-orange-500 font-bold flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/criar-conta"
              className="block w-full py-3 bg-orange-500 text-white font-semibold tracking-wide rounded-2xl text-base text-center hover:bg-orange-600 transition-colors"
            >
              Contratar Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-5 py-16 bg-gray-50">
        <h2 className="font-display text-[2rem] font-bold text-center text-gray-950 mb-10 leading-tight">
          Perguntas frequentes
        </h2>
        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { q: 'Preciso baixar um aplicativo?',        a: 'Não. O cardápio funciona direto no navegador do celular, sem nenhum download.' },
            { q: 'Posso cancelar quando quiser?',        a: 'Sim. Sem multa ou fidelidade mínima. Cancele quando precisar.' },
            { q: 'Como os clientes acessam o cardápio?', a: 'Escaneiam o QR code da mesa ou acessam pelo link do restaurante.' },
            { q: 'E se eu tiver dúvidas?',               a: 'Suporte via WhatsApp disponível para todos os clientes.' },
          ].map((f) => (
            <div key={f.q} className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-display font-semibold text-gray-900 text-base">{f.q}</p>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SaasFooter />

    </div>
  )
}
