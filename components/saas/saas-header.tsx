import Link from 'next/link'

export function SaasHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
      <Link href="/" className="text-3xl font-black tracking-tight text-gray-900">
        HIVI
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/entrar" className="px-5 py-2.5 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
          Entrar
        </Link>
        <Link href="/criar-conta" className="px-5 py-2.5 text-base font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
          Criar conta
        </Link>
      </div>
    </header>
  )
}
