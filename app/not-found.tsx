import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 text-center">

      {/* Logo */}
      <Link href="/" translate="no" className="flex items-center gap-2 mb-12 select-none">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#F97316"/>
          <line x1="16" y1="5" x2="16" y2="27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 5 L10 13 Q10 17 16 17" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M22 5 L22 13 Q22 17 16 17" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
        <span className="font-black tracking-[0.06em] text-gray-950 text-2xl">HIVI</span>
      </Link>

      {/* Número 404 */}
      <p className="text-[7rem] font-black leading-none text-gray-100 select-none mb-0">404</p>

      <h1 className="text-2xl font-bold text-gray-900 mb-3 -mt-2">
        Página não encontrada
      </h1>
      <p className="text-gray-500 text-base max-w-xs mb-10 leading-relaxed">
        O link que você seguiu pode estar incorreto ou a página foi removida.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Ir para o início
        </Link>
        <Link
          href="/conta"
          className="px-8 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Minha conta
        </Link>
      </div>
    </div>
  )
}
