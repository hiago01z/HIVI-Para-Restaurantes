import Link from 'next/link'

interface PausedPageProps {
  name: string
  logoUrl?: string | null
}

/**
 * Exibida quando o restaurante existe mas está com is_active = false.
 * Usa design neutro (sem depender do tema do restaurante).
 */
export function PausedPage({ name, logoUrl }: PausedPageProps) {
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-5 text-center">

      {/* Avatar do restaurante */}
      <div className="mb-6">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="w-20 h-20 rounded-2xl object-cover shadow-2xl"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center shadow-2xl">
            <span className="text-white font-black text-3xl select-none">{initial}</span>
          </div>
        )}
      </div>

      {/* Nome */}
      <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>

      {/* Mensagem */}
      <p className="text-gray-400 text-base mb-1">
        Este cardápio está temporariamente fora do ar.
      </p>
      <p className="text-gray-500 text-sm mb-10">
        Voltamos em breve!
      </p>

      {/* Ícone de pausa */}
      <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-10">
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-gray-500">
          <rect x="6"  y="5" width="4" height="14" rx="1.5" fill="currentColor"/>
          <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/>
        </svg>
      </div>

      {/* HIVI branding */}
      <Link
        href="/"
        translate="no"
        className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#F97316"/>
          <line x1="16" y1="5" x2="16" y2="27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 5 L10 13 Q10 17 16 17" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M22 5 L22 13 Q22 17 16 17" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
        <span className="text-white font-black tracking-[0.06em] text-base">HIVI</span>
      </Link>
    </div>
  )
}
