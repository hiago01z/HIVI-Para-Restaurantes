import Link from 'next/link'

export function SaasHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
      <Link href="/" translate="no" className="text-2xl font-black tracking-[0.06em] text-gray-950 select-none">
        HIVI
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/entrar"
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/criar-conta"
          className="px-5 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors tracking-wide"
        >
          Criar conta
        </Link>
      </div>
    </header>
  )
}
