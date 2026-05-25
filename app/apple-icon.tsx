import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Apple Touch Icon — 180×180px
 * Aparece quando usuário adiciona o site à tela inicial do iPhone/iPad.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(145deg, #FB923C 0%, #EA580C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* 3 dentes do garfo */}
          <div style={{ display: 'flex', gap: 13, marginBottom: 6 }}>
            <div style={{ width: 13, height: 45, background: 'white', borderRadius: 7 }} />
            <div style={{ width: 13, height: 45, background: 'white', borderRadius: 7 }} />
            <div style={{ width: 13, height: 45, background: 'white', borderRadius: 7 }} />
          </div>
          {/* Separador */}
          <div style={{ width: 56, height: 10, background: 'white', borderRadius: 5, marginBottom: 6 }} />
          {/* Cabo */}
          <div style={{ width: 13, height: 52, background: 'white', borderRadius: 7 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
