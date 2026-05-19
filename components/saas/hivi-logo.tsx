import Link from 'next/link'

/**
 * Marca HIVI: quadrado laranja arredondado com garfo de 3 dentes (SVG)
 * + texto "HIVI" em fonte black uppercase.
 */
function ForkMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      {/* Fundo laranja arredondado */}
      <rect width="32" height="32" rx="8" fill="#F97316" />

      {/*
        Garfo de 3 dentes:
        - Espinha central (dente do meio + cabo): linha reta de cima a baixo
        - Dente esquerdo: desce, depois curva para encontrar o centro
        - Dente direito: espelha o esquerdo
      */}

      {/* Espinha central: dente do meio + cabo */}
      <line
        x1="16" y1="5"
        x2="16" y2="27"
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Dente esquerdo — desce até y=13, depois curva para (16,17) */}
      <path
        d="M10 5 L10 13 Q10 17 16 17"
        stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Dente direito — espelho */}
      <path
        d="M22 5 L22 13 Q22 17 16 17"
        stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

type Size = 'sm' | 'md' | 'lg'

const cfg = {
  sm: { mark: 24, text: 'text-xl'  },
  md: { mark: 30, text: 'text-2xl' },
  lg: { mark: 40, text: 'text-3xl' },
}

interface HiviLogoProps {
  size?: Size
  href?: string
  className?: string
  /** Mostra apenas o ícone, sem o texto HIVI */
  iconOnly?: boolean
}

export function HiviLogo({
  size = 'md',
  href = '/',
  className = '',
  iconOnly = false,
}: HiviLogoProps) {
  const s = cfg[size]
  return (
    <Link
      href={href}
      translate="no"
      className={`inline-flex items-center gap-2 select-none ${className}`}
    >
      <ForkMark size={s.mark} />
      {!iconOnly && (
        <span className={`font-black tracking-[0.06em] text-gray-950 ${s.text}`}>
          HIVI
        </span>
      )}
    </Link>
  )
}
