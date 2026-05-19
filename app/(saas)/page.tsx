import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-2xl font-bold">HIVI</span>
        <nav className="flex gap-6 text-sm">
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#precos">Preços</Link>
          <Link href="#faq">FAQ</Link>
        </nav>
        <div className="flex gap-2">
          <Link href="/entrar" className="px-4 py-2 text-sm border rounded-md">Entrar</Link>
          <Link href="/criar-conta" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">Criar conta</Link>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center py-24 text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Cardápio Online para o seu Restaurante</h1>
        <p className="text-muted-foreground max-w-xl mb-8">
          Crie seu cardápio digital, gere QR codes para as mesas e gerencie pedidos em tempo real. Tudo em um único lugar.
        </p>
        <Link href="/criar-conta" className="px-8 py-3 bg-primary text-primary-foreground rounded-md text-lg font-medium">
          Começar agora
        </Link>
      </section>
    </main>
  )
}
