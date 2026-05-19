import Link from 'next/link'

export function SaasFooter() {
  return (
    <footer className="border-t border-gray-100 px-5 py-10">
      <div className="text-center mb-5">
        <span className="font-display text-lg font-bold italic text-gray-400">HIVI</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-gray-400 tracking-wide uppercase mb-5">
        <Link href="/como-funciona" className="hover:text-gray-700 transition-colors">Como funciona</Link>
        <Link href="/precos"        className="hover:text-gray-700 transition-colors">Preços</Link>
        <Link href="/faq"           className="hover:text-gray-700 transition-colors">FAQ</Link>
        <Link href="/feedback"      className="hover:text-gray-700 transition-colors">Feedback</Link>
        <Link href="/entrar"        className="hover:text-gray-700 transition-colors">Entrar</Link>
        <Link href="/privacidade"   className="hover:text-gray-700 transition-colors">Privacidade</Link>
        <Link href="/termos"        className="hover:text-gray-700 transition-colors">Termos</Link>
      </nav>
      <p className="text-center text-xs text-gray-400">
        &copy; 2026 HIVI Tecnologia &mdash; Todos os direitos reservados
      </p>
    </footer>
  )
}
