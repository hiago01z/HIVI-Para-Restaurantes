'use client'
import { useEffect } from 'react'

/** Luminância relativa WCAG — mesma lógica de lib/color-utils.ts (duplicada para evitar import server no client) */
function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  if (full.length !== 6) return '#ffffff'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const srgb = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  const contrastWhite = 1.05 / (lum + 0.05)
  const contrastBlack = (lum + 0.05) / 0.05
  return contrastWhite >= contrastBlack ? '#ffffff' : '#000000'
}

/**
 * Escuta mensagens postMessage do tipo HIVI_THEME_PREVIEW
 * e aplica as CSS variables em tempo real sem recarregar a página.
 * Usado para a prévia ao vivo no painel ADM > Configurações.
 */
export function PreviewListener() {
  useEffect(() => {
    function handler(e: MessageEvent) {
      // Aceita apenas mensagens da mesma origem (proteção contra iframes maliciosos)
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== 'HIVI_THEME_PREVIEW') return
      const t = e.data.theme as {
        primary?: string
        secondary?: string
        bg?: string
        text?: string
        font?: string
        icon?: string
        labelFont?: string
        labelColor?: string
        labelTextShadow?: string
      }

      const root = document.documentElement

      if (t.primary) {
        root.style.setProperty('--menu-primary', t.primary)
        root.style.setProperty('--menu-text-on-primary', getContrastColor(t.primary))
      }
      if (t.secondary) root.style.setProperty('--menu-secondary', t.secondary)
      if (t.icon)      root.style.setProperty('--menu-icon',      t.icon)
      if (t.font)      root.style.setProperty('--menu-font',      t.font)

      if (t.bg) {
        root.style.setProperty('--menu-bg', t.bg)
        root.style.setProperty('--menu-text-on-bg', getContrastColor(t.bg))
      }
      if (t.text) {
        root.style.setProperty('--menu-text',       t.text)
        root.style.setProperty('--menu-text-muted', t.text + '99')
      }
      if (t.bg && t.text) {
        root.style.setProperty(
          '--menu-card',
          `color-mix(in srgb, ${t.bg} 70%, ${t.text} 8%)`
        )
      }

      // Label sobre imagem
      if (t.labelFont)       root.style.setProperty('--label-font', t.labelFont)
      if (t.labelColor)      root.style.setProperty('--label-color', t.labelColor)
      if (t.labelTextShadow) root.style.setProperty('--label-text-shadow', t.labelTextShadow)

      // Atualiza o elemento raiz do menu diretamente (estilos inline do layout)
      const menuRoot = document.getElementById('menu-root')
      if (menuRoot) {
        if (t.bg)   menuRoot.style.background = t.bg
        if (t.text) menuRoot.style.color      = t.text
        if (t.font) menuRoot.style.fontFamily = t.font
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return null
}
