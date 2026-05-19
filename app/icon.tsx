import { ImageResponse } from 'next/og'

export const dynamic = 'force-dynamic'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Favicon dinâmico: quadrado laranja com garfo branco de 3 dentes.
 * Gerado via next/og (satori) — sem dependências externas.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(145deg, #FB923C 0%, #EA580C 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Garfo simulado com divs — satori não suporta SVG inline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* 3 dentes do garfo */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 1 }}>
            <div style={{ width: 2.5, height: 8, background: 'white', borderRadius: 2 }} />
            <div style={{ width: 2.5, height: 8, background: 'white', borderRadius: 2 }} />
            <div style={{ width: 2.5, height: 8, background: 'white', borderRadius: 2 }} />
          </div>
          {/* Separador */}
          <div style={{ width: 10, height: 2, background: 'white', borderRadius: 1, marginBottom: 1 }} />
          {/* Cabo */}
          <div style={{ width: 2.5, height: 9, background: 'white', borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
