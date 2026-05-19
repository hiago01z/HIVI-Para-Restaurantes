import Link from 'next/link'
import { QrCode, Smartphone, TrendingUp, Clock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <span className="text-2xl font-black tracking-tight">HIVI</span>
        <div className="flex items-center gap-2">
          <Link href="/entrar" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Entrar
          </Link>
          <Link href="/criar-conta" className="px-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Criar conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-50 px-5 pt-12 pb-16 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 mb-8">
          Cardápio Online
        </h1>

        {/* Mockup do app */}
        <div className="mx-auto w-52 bg-[#2C1A0E] rounded-3xl p-2 shadow-2xl mb-10">
          <div className="rounded-2xl overflow-hidden">
            {/* Header mockup */}
            <div className="bg-[#2C1A0E] flex items-center gap-1.5 px-3 pt-3 pb-2">
              <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-[10px]">B</span>
              </div>
              <div className="flex-1 h-6 bg-[#3D2110] rounded-full" />
              <div className="w-6 h-6 bg-[#3D2110] rounded-full" />
              <div className="w-6 h-6 bg-[#3D2110] rounded-full" />
            </div>
            {/* Destaque mockup */}
            <div className="bg-[#2C1A0E] px-3 pb-1">
              <p className="text-orange-400 font-bold text-base" style={{ fontFamily: 'cursive' }}>Nome</p>
              <p className="text-gray-500 text-[9px] leading-tight mb-2">descrição do nome, especificações, ingredientes, etc</p>
              <div className="flex gap-1.5 mb-1.5">
                <div className="flex-1 h-14 bg-[#3D2110] rounded-lg flex items-end p-1.5">
                  <span className="text-orange-400 text-[10px] font-bold">Combos</span>
                </div>
                <div className="flex-1 h-14 bg-[#3D2110] rounded-lg flex items-end p-1.5">
                  <span className="text-orange-400 text-[10px] font-bold">Completo</span>
                </div>
              </div>
              <div className="flex gap-1.5 pb-3">
                <div className="flex-1 h-14 bg-[#3D2110] rounded-lg flex items-end p-1.5">
                  <span className="text-orange-400 text-[10px] font-bold">Bebidas</span>
                </div>
                <div className="flex-1 h-14 bg-[#3D2110] rounded-lg flex items-end p-1.5">
                  <span className="text-orange-400 text-[10px] font-bold">Especial</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/criar-conta"
          className="inline-block px-8 py-3 bg-orange-500 text-white font-bold rounded-xl text-lg hover:bg-orange-600 transition-colors shadow-md"
        >
          Começar agora
        </Link>
      </section>

      {/* Informações */}
      <section className="px-6 py-12 text-center">
        <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
          Outras informações importantes que os clientes gostariam de saber, como QR code nas mesas com direcionamento para o cardápio online.
        </p>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="px-5 py-12 bg-gray-50">
        <h2 className="text-3xl font-black uppercase text-center text-gray-900 mb-8">
          Benefícios
        </h2>
        <p className="text-center text-sm text-gray-500 mb-8 -mt-4">
          Benefícios de contratar o cardápio online
        </p>
        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { icon: QrCode,      title: 'QR Code nas mesas',    desc: 'Clientes fazem pedidos direto pelo celular, sem esperar o garçom.' },
            { icon: Smartphone,  title: 'Cardápio digital',      desc: 'Atualize preços e itens em tempo real, sem custo de impressão.' },
            { icon: TrendingUp,  title: 'Mais pedidos',          desc: 'Clientes pedem mais quando navegam sozinhos pelo cardápio.' },
            { icon: Clock,       title: 'Atendimento rápido',    desc: 'Pedidos chegam direto para a equipe, sem erros de comunicação.' },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quem usa aprova */}
      <section id="depoimentos" className="px-5 py-12">
        <h2 className="text-3xl font-black uppercase text-center text-gray-900 mb-2">
          Quem usa aprova
        </h2>
        <p className="text-center text-sm text-gray-500 mb-8">
          Avaliações de clientes da HIVI
        </p>
        <div className="space-y-4 max-w-sm mx-auto">
          {[
            { name: 'Carlos Silva',   rest: 'Restaurante Silva',  text: 'Depois do HIVI os pedidos aumentaram 30%. Os clientes adoram pedir pelo celular.' },
            { name: 'Ana Ferreira',   rest: 'Cantina Ana',        text: 'Muito fácil de configurar. Em menos de 1 hora já estava funcionando nas mesas.' },
            { name: 'João Oliveira',  rest: 'Churrascaria JO',    text: 'Acabou com os erros de pedido. Hoje tudo chega certinho para a cozinha.' },
          ].map((t) => (
            <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <p className="text-gray-600 text-sm leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
              <p className="font-bold text-sm text-gray-900">{t.name}</p>
              <p className="text-xs text-orange-500">{t.rest}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-5 py-12 bg-gray-50">
        <h2 className="text-3xl font-black uppercase text-center text-gray-900 mb-10">
          Como funciona
        </h2>
        <div className="space-y-8 max-w-sm mx-auto">
          {[
            { step: '1', title: 'Crie sua conta',         desc: 'Acesse com o Google e escolha seu plano em menos de 2 minutos.' },
            { step: '2', title: 'Configure seu cardápio', desc: 'Adicione categorias, pratos, fotos e preços no painel administrativo.' },
            { step: '3', title: 'Publique e receba',      desc: 'Imprima o QR code, coloque nas mesas e comece a receber pedidos.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-11 h-11 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-xl flex-shrink-0 shadow-md">
                {s.step}
              </div>
              <div className="pt-1">
                <p className="font-bold text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="px-5 py-12">
        <h2 className="text-3xl font-black uppercase text-center text-gray-900 mb-8">
          Preços
        </h2>
        <div className="max-w-xs mx-auto">
          <div className="border-2 border-orange-500 rounded-2xl p-6 text-center shadow-lg">
            <p className="font-bold text-gray-700 mb-1">Plano Básico</p>
            <div className="my-5">
              <span className="text-5xl font-black text-gray-900">R$&nbsp;59</span>
              <span className="text-2xl font-black text-gray-900">,99</span>
              <span className="text-gray-400 text-sm block mt-1">por mês</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-2.5 mb-6 text-left">
              {[
                'Cardápio digital público',
                'Painel administrativo',
                'QR code de mesa',
                'Pedidos de mesa',
                'Categorias e pratos ilimitados',
                'Upload de fotos dos pratos',
                'Suporte via WhatsApp',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-orange-500 font-bold flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/criar-conta"
              className="block w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Contratar agora
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-12 bg-gray-50">
        <h2 className="text-3xl font-black uppercase text-center text-gray-900 mb-8">
          FAQ
        </h2>
        <div className="space-y-3 max-w-sm mx-auto">
          {[
            { q: 'Preciso baixar um aplicativo?',        a: 'Não. O cardápio funciona direto no navegador do celular, sem nenhum download.' },
            { q: 'Posso cancelar quando quiser?',        a: 'Sim. Sem multa ou fidelidade mínima. Cancele quando precisar.' },
            { q: 'Como os clientes acessam o cardápio?', a: 'Escaneiam o QR code da mesa ou acessam pelo link do restaurante.' },
            { q: 'E se eu tiver dúvidas?',               a: 'Suporte via WhatsApp disponível para todos os clientes.' },
          ].map((f) => (
            <div key={f.q} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="font-bold text-gray-900 text-sm">{f.q}</p>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-5 py-8">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400 mb-4">
          <Link href="#como-funciona" className="hover:text-gray-700 transition-colors">Como funciona</Link>
          <Link href="#precos"        className="hover:text-gray-700 transition-colors">Preços</Link>
          <Link href="#faq"           className="hover:text-gray-700 transition-colors">FAQ</Link>
          <Link href="#"              className="hover:text-gray-700 transition-colors">Feedback</Link>
          <Link href="/entrar"        className="hover:text-gray-700 transition-colors">Entrar</Link>
          <Link href="/privacidade"   className="hover:text-gray-700 transition-colors">Privacidade</Link>
          <Link href="/termos"        className="hover:text-gray-700 transition-colors">Termos</Link>
        </nav>
        <p className="text-center text-xs text-gray-400">
          2026 HIVI Tecnologia — Todos os direitos reservados
        </p>
      </footer>

    </div>
  )
}
