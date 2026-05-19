/**
 * HIVI — Utilitários de cor e contraste
 * Garante acessibilidade (WCAG AA) em qualquer combinação de cor primária/fundo.
 */

/** Converte hex (#rrggbb ou #rgb) em componentes RGB 0-255. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  const full  = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  if (full.length !== 6) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * Calcula a luminância relativa de uma cor (WCAG 2.1).
 * Retorna valor entre 0 (preto) e 1 (branco).
 */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0.5

  const srgb = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/**
 * Retorna '#ffffff' ou '#000000' — o que tiver maior contraste com `bgHex`.
 * Garante conformidade com WCAG AA (mínimo 4.5:1).
 */
export function getContrastColor(bgHex: string): string {
  const lum = relativeLuminance(bgHex)
  // Contraste com branco: (1 + 0.05) / (lum + 0.05)
  // Contraste com preto:  (lum + 0.05) / (0 + 0.05)
  const contrastWithWhite = 1.05 / (lum + 0.05)
  const contrastWithBlack = (lum + 0.05) / 0.05
  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000'
}
