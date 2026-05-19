import Link from 'next/link'
import { QrCode, Smartphone, TrendingUp, Clock, ScanLine, UtensilsCrossed, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <span className="text-3xl font-black tracking-tight text-gray-900">HIVI</span>
        <div className="flex items-center gap-3">
          <Link href="/entrar" className="px-5 py-2.5 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Entrar
          </Link>
          <Link href="/criar-conta" className="px-5 py-2.5 text-base font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
            Criar conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-50 px-5 pt-14 pb-20 text-center">
        <h1 className="text-5xl font-black uppercase tracking-tight text-gray-900 mb-4 leading-tight">
          Cardápio<br />Online
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
          Cardápio digital com QR code nas mesas para o seu restaurante.
        </p>

        {/* Mockup do app */}
        <div className="mx-auto w-60 bg-[#2C1A0E] rounded-3xl p-2.5 shadow-2xl mb-12">
          <div className="rounded-2xl overflow-hidden">
            <div className="bg-[#2C1A0E] flex items-center gap-2 px-3 pt-3 pb-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-xs">B</span>
              </div>
              <div className="flex-1 h-7 bg-[#3D2110] rounded-full" />
              <div className="w-7 h-7 bg-[#3D2110] rounded-full" />
              <div className="w-7 h-7 bg-[#3D2110] rounded-full" />
            </div>
            <div className="bg-[#2C1A0E] px-3 pb-1">
              <p className="text-orange-400 font-bold text-lg mb-0.5" style={{ fontFamily: 'cursive' }}>Destaques</p>
              <p className="text-gray-500 text-[10px] leading-tight mb-3">descrição, ingredientes, etc</p>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 h-16 bg-[#3D2110] rounded-xl flex items-end p-2">
                  <span className="text-orange-400 text-xs font-bold">Combos</span>
                </div>
                <div className="flex-1 h-16 bg-[#3D2110] rounded-xl flex items-end p-2">
                  <span className="text-orange-400 text-xs font-bold">Completo</span>
                </div>
              </div>
              <div className="flex gap-2 pb-4">
                <div className="flex-1 h-16 bg-[#3D2110] rounded-xl flex items-end p-2">
                  <span className="text-orange-400 text-xs font-bold">Bebidas</span>
                </div>
                <div className="flex-1 h-16 bg-[#3D2110] rounded-xl flex items-end p-2">
                  <span className="text-orange-400 text-xs font-bold">Especial</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/criar-conta"
          className="inline-block px-10 py-4 bg-orange-500 text-white font-black rounded-2xl text-xl hover:bg-orange-600 transition-colors shadow-lg"
        >
          Começar agora
        </Link>
        <p className="text-sm text-gray-400 mt-3">Sem fidelidade • Cancele quando quiser</p>
      </section>

      {/* Informações importantes — QR Code nas mesas */}
      <section className="px-5 py-16">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mx-auto mb-6">
            <QrCode className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 text-center mb-4 leading-tight">
            QR Code nas mesas
          </h2>
          <p className="text-lg text-gray-600 text-center leading-relaxed mb-10">
            Seu cliente escaneia o QR code da mesa, vê o cardápio no celular e faz o pedido — sem precisar chamar o garçom.
          </p>

          {/* Fluxo visual */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-gray-50 rounded-2xl p-5">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">1. Cliente escaneia</p>
                <p className="text-gray-500 text-base mt-1 leading-relaxed">
                  O QR code fica impresso na mesa ou em um suporte. Basta apontar a câmera do celular.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-50 rounded-2xl p-5">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">2. Navega pelo cardápio</p>
                <p className="text-gray-500 text-base mt-1 leading-relaxed">
                  O cardápio abre direto no navegador, sem baixar nenhum aplicativo. Fotos, preços e categorias organizadas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-50 rounded-2xl p-5">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">3. Faz o pedido</p>
                <p className="text-gray-500 text-base mt-1 leading-relaxed">
                  Monta o carrinho e gera um QR code para o garçom confirmar. O pedido entra direto no painel do restaurante.
                </p>
              </div>
            </div>
          </div>

          {/* Destaques rápidos */}
          <div className="mt-8 space-y-3">
            {[
              'Sem download de aplicativo',
              'Funciona em qualquer celular',
              'QR code para imprimir grátis',
              'Pedidos chegam em tempo real',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700 text-base font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="px-5 py-16 bg-gray-50">
        <h2 className="text-4xl font-black uppercase text-center text-gray-900 mb-3">
          Benefícios
        </h2>
        <p className="text-center text-base text-gray-500 mb-10">
          Vantagens de ter o cardápio online
        </p>
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { icon: QrCode,     title: 'QR Code nas mesas',   desc: 'Clientes fazem pedidos direto pelo celular, sem esperar o garçom.' },
            { icon: Smartphone, title: 'Cardápio digital',    desc: 'Atualize preços e itens em tempo real, sem custo de impressão.' },
            { icon: TrendingUp, title: 'Mais pedidos',        desc: 'Clientes pedem mais quando navegam sozinhos pelo cardápio.' },
            { icon: Clock,      title: 'Atendimento rápido',  desc: 'Pedidos chegam direto para a equipe, sem erros de comunicação.' },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <b.icon className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{b.title}</p>
                <p className="text-base text-gray-500 mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quem usa aprova */}
      <section id="depoimentos" className="px-5 py-16">
        <h2 className="text-4xl font-black uppercase text-center text-gray-900 mb-3">
          Quem usa aprova
        </h2>
        <p className="text-center text-base text-gray-500 mb-10">
          Avaliações de clientes da HIVI
        </p>
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { name: 'Carlos Silva',  rest: 'Restaurante Silva', text: 'Depois do HIVI os pedidos aumentaram 30%. Os clientes adoram pedir pelo celular.' },
            { name: 'Ana Ferreira',  rest: 'Cantina Ana',       text: 'Muito fácil de configurar. Em menos de 1 hora já estava funcionando nas mesas.' },
            { name: 'João Oliveira', rest: 'Churrascaria JO',   text: 'Acabou com os erros de pedido. Hoje tudo chega certinho para a cozinha.' },
          ].map((t) => (
            <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="text-gray-700 text-base leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <p className="font-bold text-base text-gray-900">{t.name}</p>
              <p className="text-sm text-orange-500 mt-0.5">{t.rest}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-5 py-16 bg-gray-50">
        <h2 className="text-4xl font-black uppercase text-center text-gray-900 mb-12">
          Como funciona
        </h2>
        <div className="space-y-10 max-w-sm mx-auto">
          {[
            { step: '1', title: 'Crie sua conta',         desc: 'Acesse com o Google e escolha seu plano em menos de 2 minutos.' },
            { step: '2', title: 'Configure seu cardápio', desc: 'Adicione categorias, pratos, fotos e preços no painel administrativo.' },
            { step: '3', title: 'Publique e receba',      desc: 'Imprima o QR code, coloque nas mesas e comece a receber pedidos.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-5">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-md">
                {s.step}
              </div>
              <div className="pt-2">
                <p className="font-black text-xl text-gray-900">{s.title}</p>
                <p className="text-base text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="px-5 py-16">
        <h2 className="text-4xl font-black uppercase text-center text-gray-900 mb-10">
          Preços
        </h2>
        <div className="max-w-xs mx-auto">
          <div className="border-2 border-orange-500 rounded-3xl p-7 shadow-xl">
            <p className="font-bold text-gray-600 text-lg text-center mb-1">Plano Básico</p>
            <div className="text-center my-6">
              <div>
                <span className="text-6xl font-black text-gray-900">R$&nbsp;59</span>
                <span className="text-3xl font-black text-gray-900">,99</span>
              </div>
              <span className="text-base text-gray-400 mt-1 block">por mês</span>
            </div>
            <ul className="text-base text-gray-600 space-y-3 mb-8">
              {[
                'Cardápio digital público',
                'Painel administrativo',
                'QR code de mesa',
                'Pedidos de mesa',
                'Categorias e pratos ilimitados',
                'Upload de fotos dos pratos',
                'Suporte via WhatsApp',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-orange-500 font-black text-lg flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/criar-conta"
              className="block w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-lg text-center hover:bg-orange-600 transition-colors"
            >
              Contratar agora
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-16 bg-gray-50">
        <h2 className="text-4xl font-black uppercase text-center text-gray-900 mb-10">
          FAQ
        </h2>
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { q: 'Preciso baixar um aplicativo?',        a: 'Não. O cardápio funciona direto no navegador do celular, sem nenhum download.' },
            { q: 'Posso cancelar quando quiser?',        a: 'Sim. Sem multa ou fidelidade mínima. Cancele quando precisar.' },
            { q: 'Como os clientes acessam o cardápio?', a: 'Escaneiam o QR code da mesa ou acessam pelo link do restaurante.' },
            { q: 'E se eu tiver dúvidas?',               a: 'Suporte via WhatsApp disponível para todos os clientes.' },
          ].map((f) => (
            <div key={f.q} className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-gray-900 text-lg">{f.q}</p>
              <p className="text-gray-500 text-base mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-5 py-10">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-400 mb-5">
          <Link href="#como-funciona" className="hover:text-gray-700 transition-colors">Como funciona</Link>
          <Link href="#precos"        className="hover:text-gray-700 transition-colors">Preços</Link>
          <Link href="#faq"           className="hover:text-gray-700 transition-colors">FAQ</Link>
          <Link href="#"              className="hover:text-gray-700 transition-colors">Feedback</Link>
          <Link href="/entrar"        className="hover:text-gray-700 transition-colors">Entrar</Link>
          <Link href="/privacidade"   className="hover:text-gray-700 transition-colors">Privacidade</Link>
          <Link href="/termos"        className="hover:text-gray-700 transition-colors">Termos</Link>
        </nav>
        <p className="text-center text-sm text-gray-400">
          2026 HIVI Tecnologia — Todos os direitos reservados
        </p>
      </footer>

    </div>
  )
}
