import { ImageResponse } from 'next/og'

export const size = { width: 96, height: 96 }
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
          width: 96,
          height: 96,
          background: 'linear-gradient(145deg, #FB923C 0%, #EA580C 100%)',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Garfo simulado com divs — satori não suporta SVG inline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* 3 dentes do garfo */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 7, height: 24, background: 'white', borderRadius: 4 }} />
            <div style={{ width: 7, height: 24, background: 'white', borderRadius: 4 }} />
            <div style={{ width: 7, height: 24, background: 'white', borderRadius: 4 }} />
          </div>
          {/* Separador */}
          <div style={{ width: 30, height: 5, background: 'white', borderRadius: 3, marginBottom: 3 }} />
          {/* Cabo */}
          <div style={{ width: 7, height: 28, background: 'white', borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
