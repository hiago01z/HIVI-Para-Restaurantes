'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Loader2, Upload, Download, Instagram, Phone, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type Restaurant = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  instagram_url: string | null
  whatsapp_number: string | null
}

type Theme = {
  primary_color: string
  secondary_color: string
  background_color: string
  font_family: string
  banner_url: string | null
  text_color: string
  icon_color: string
}

const PRESET_THEMES = [
  { name: 'Rústico', primary: '#FF6B00', secondary: '#1A0A00', bg: '#2C1A0E', font: 'serif',      text: '#FFFFFF', icon: '#FF6B00' },
  { name: 'Moderno', primary: '#6366F1', secondary: '#0F172A', bg: '#1E293B', font: 'sans-serif', text: '#FFFFFF', icon: '#6366F1' },
  { name: 'Claro',   primary: '#F97316', secondary: '#F3F4F6', bg: '#FFFFFF', font: 'sans-serif', text: '#111827', icon: '#F97316' },
  { name: 'Verde',   primary: '#10B981', secondary: '#064E3B', bg: '#022C22', font: 'serif',      text: '#FFFFFF', icon: '#10B981' },
]

const FONT_OPTIONS = [
  { value: 'serif',      label: 'Serif (clássico)' },
  { value: 'sans-serif', label: 'Sans-serif (moderno)' },
  { value: 'monospace',  label: 'Monospace (técnico)' },
  { value: 'cursive',    label: 'Cursive (manuscrito)' },
]

export function ConfiguracoesClient({
  restaurant,
  theme: initialTheme,
  staffCount,
}: {
  restaurant: Restaurant
  theme: Theme
  staffCount: number
}) {
  const supabase = createClient()

  // Redes sociais
  const [instagram, setInstagram] = useState(restaurant.instagram_url ?? '')
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp_number ?? '')
  const [socialSaving, setSocialSaving] = useState(false)
  const [socialSaved, setSocialSaved] = useState(false)

  // Tema
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)

  // Logo & Banner
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo_url)
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialTheme.banner_url)
  const [logoLoading, setLogoLoading] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // QR Code
  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${restaurant.slug}`
    : `https://hivi.com.br/${restaurant.slug}`

  async function saveSocial() {
    setSocialSaving(true)
    await supabase
      .from('restaurants')
      .update({
        instagram_url: instagram.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
      })
      .eq('id', restaurant.id)
    setSocialSaving(false)
    setSocialSaved(true)
    setTimeout(() => setSocialSaved(false), 2000)
  }

  async function saveTheme() {
    setThemeSaving(true)
    // Upsert do tema
    await supabase
      .from('restaurant_themes')
      .upsert({
        restaurant_id: restaurant.id,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        background_color: theme.background_color,
        font_family: theme.font_family,
        banner_url: theme.banner_url,
        text_color: theme.text_color,
        icon_color: theme.icon_color,
      }, { onConflict: 'restaurant_id' })
    setThemeSaving(false)
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  function applyPreset(preset: typeof PRESET_THEMES[0]) {
    setTheme((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      background_color: preset.bg,
      font_family: preset.font,
      text_color: preset.text,
      icon_color: preset.icon,
    }))
  }

  async function uploadLogo(file: File) {
    setLogoLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${restaurant.id}/logo.${ext}`
      const { error } = await supabase.storage
        .from('restaurant-images')
        .upload(path, file, { upsert: true })
      if (error) return
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
      setLogoPreview(data.publicUrl)
      await supabase.from('restaurants').update({ logo_url: data.publicUrl }).eq('id', restaurant.id)
    } finally {
      setLogoLoading(false)
    }
  }

  async function uploadBanner(file: File) {
    setBannerLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${restaurant.id}/banner.${ext}`
      const { error } = await supabase.storage
        .from('restaurant-images')
        .upload(path, file, { upsert: true })
      if (error) return
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
      setBannerPreview(data.publicUrl)
      setTheme((prev) => ({ ...prev, banner_url: data.publicUrl }))
    } finally {
      setBannerLoading(false)
    }
  }

  function downloadQr() {
    const svg = document.getElementById('menu-qrcode')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')!
    const img = document.createElement('img') as HTMLImageElement
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 0, 0, 400, 400)
      const a = document.createElement('a')
      a.download = `qrcode-${restaurant.slug}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>

      {/* ── Redes Sociais ── */}
      <Section title="Redes Sociais">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Instagram className="w-4 h-4 text-pink-500" /> Instagram
            </label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/seurestaurante"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-4 h-4 text-green-500" /> WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999999999 (com DDI + DDD)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
            />
            <p className="text-xs text-gray-400 mt-1">Formato: 55 + DDD + número. Ex: 5511999999999</p>
          </div>
          <SaveButton onClick={saveSocial} loading={socialSaving} saved={socialSaved} />
        </div>
      </Section>

      {/* ── Logo e Banner ── */}
      <Section title="Logo e Banner">
        <div className="grid grid-cols-2 gap-4">
          {/* Logo */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Logo</p>
            <div
              onClick={() => logoRef.current?.click()}
              className="adm-upload-area h-28"
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="logo" fill className="object-contain p-2" />
              ) : (
                <div className="text-center">
                  {logoLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--adm-primary)' }} /> : (
                    <>
                      <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Logo</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
            />
          </div>

          {/* Banner */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Banner do cardápio</p>
            <div
              onClick={() => bannerRef.current?.click()}
              className="adm-upload-area h-28"
            >
              {bannerPreview ? (
                <Image src={bannerPreview} alt="banner" fill className="object-cover" />
              ) : (
                <div className="text-center">
                  {bannerLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--adm-primary)' }} /> : (
                    <>
                      <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Banner</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f) }}
            />
          </div>
        </div>
      </Section>

      {/* ── Tema ── */}
      <Section title="Aparência do Cardápio">

        {/* Temas pré-definidos */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Temas prontos</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="rounded-xl overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all"
                title={preset.name}
              >
                <div
                  className="h-10 flex items-center justify-center text-xs font-bold"
                  style={{ background: preset.bg, color: preset.primary }}
                >
                  {preset.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cores */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ColorField
            label="Cor primária"
            value={theme.primary_color}
            onChange={(v) => setTheme((t) => ({ ...t, primary_color: v }))}
          />
          <ColorField
            label="Cor de fundo"
            value={theme.background_color}
            onChange={(v) => setTheme((t) => ({ ...t, background_color: v }))}
          />
          <ColorField
            label="Cor do texto"
            value={theme.text_color}
            onChange={(v) => setTheme((t) => ({ ...t, text_color: v }))}
          />
          <ColorField
            label="Cor dos ícones"
            value={theme.icon_color}
            onChange={(v) => setTheme((t) => ({ ...t, icon_color: v }))}
          />
          <ColorField
            label="Cor secundária"
            value={theme.secondary_color}
            onChange={(v) => setTheme((t) => ({ ...t, secondary_color: v }))}
          />
        </div>

        {/* Fonte */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Família de fonte</label>
          <select
            value={theme.font_family}
            onChange={(e) => setTheme((t) => ({ ...t, font_family: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* ── Prévia do cardápio — mockup de celular ── */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Prévia em tempo real
          </p>

          {(() => {
            const cardBg = `color-mix(in srgb, ${theme.background_color} 62%, ${theme.text_color} 14%)`
            const menuFont =
              theme.font_family === 'serif'      ? "'Playfair Display', Georgia, serif" :
              theme.font_family === 'sans-serif' ? "system-ui, sans-serif" :
              theme.font_family === 'monospace'  ? "'Courier New', monospace" :
              theme.font_family === 'cursive'    ? "Georgia, cursive" :
              theme.font_family

            const cats = [
              { name: 'Combos',    emoji: '🍔' },
              { name: 'Completo',  emoji: '🍽️' },
              { name: 'Especiais', emoji: '⭐' },
              { name: 'Bebidas',   emoji: '🥤' },
              { name: 'Petisco',   emoji: '🍟' },
              { name: 'Drink',     emoji: '🍹' },
            ]

            return (
              <div
                className="mx-auto rounded-[2.25rem] overflow-hidden shadow-2xl"
                style={{
                  width: '280px',
                  background: theme.background_color,
                  border: '5px solid #111827',
                  fontFamily: menuFont,
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="text-[9px] font-bold" style={{ color: theme.text_color, opacity: 0.8 }}>9:41</span>
                  <div className="flex items-center gap-1.5" style={{ color: theme.text_color, opacity: 0.8 }}>
                    {/* WiFi */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <path d="M1.5 8.5a13 13 0 0121 0M5 12a10 10 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01"/>
                    </svg>
                    {/* Battery */}
                    <div className="flex items-center gap-0.5">
                      <div className="w-4 h-2.5 rounded-sm border border-current flex items-center px-0.5">
                        <div className="h-1.5 w-2/3 rounded-sm" style={{ background: theme.text_color }} />
                      </div>
                      <div className="w-0.5 h-1.5 rounded-r-sm" style={{ background: theme.text_color, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>

                {/* Header do cardápio */}
                <div
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', background: theme.background_color }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={{ background: theme.primary_color, color: theme.text_color }}
                    >
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-semibold truncate max-w-[85px]" style={{ color: theme.text_color, fontFamily: menuFont }}>
                      {restaurant.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5" style={{ color: theme.icon_color }}>
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    {/* Cart with badge */}
                    <div className="relative">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" style={{ color: theme.icon_color }}>
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black" style={{ background: theme.primary_color, color: theme.text_color }}>2</span>
                    </div>
                    {/* Menu */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5" style={{ color: theme.icon_color }}>
                      <path d="M3 6h18M3 12h18M3 18h18"/>
                    </svg>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="px-2 pt-2 pb-3">

                  {/* Carrossel — quadrado */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden mb-2"
                    style={{ aspectRatio: '1/1', background: cardBg }}
                  >
                    {/* foto simulada com gradiente de comida */}
                    <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '72px', opacity: 0.35 }}>🥩</div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, transparent 40%)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.1) 55%, transparent 80%)' }} />

                    {/* Preço */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: theme.primary_color, color: theme.text_color }}>
                      45,99
                    </div>

                    {/* Dots */}
                    <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
                      <span className="block rounded-full" style={{ width: '14px', height: '5px', background: theme.primary_color }} />
                      <span className="block rounded-full opacity-40" style={{ width: '5px', height: '5px', background: theme.text_color }} />
                      <span className="block rounded-full opacity-40" style={{ width: '5px', height: '5px', background: theme.text_color }} />
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-bold leading-tight mb-0.5" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '15px' }}>
                        Picanha na Brasa
                      </p>
                      <p className="mb-2.5 opacity-65 leading-snug" style={{ color: theme.text_color, fontSize: '9px' }}>
                        Acompanha arroz, farofa e vinagrete
                      </p>
                      <div className="flex gap-1.5">
                        <div className="flex-1 py-2 rounded-xl text-center font-semibold" style={{ background: theme.primary_color, color: theme.text_color, fontSize: '10px' }}>
                          Pedir agora
                        </div>
                        <div className="flex-1 py-2 rounded-xl text-center font-semibold flex items-center justify-center gap-1" style={{ background: 'rgba(255,255,255,0.15)', color: theme.text_color, fontSize: '10px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3" style={{ color: theme.icon_color }}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/></svg>
                          Adicionar
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Label */}
                  <p className="font-bold mb-1.5 tracking-tight" style={{ color: theme.primary_color, fontFamily: menuFont, fontSize: '12px' }}>
                    Cardápio
                  </p>

                  {/* Categorias padrão 2+1+2+1 */}
                  {/* Par 1: Combos + Completo */}
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    {cats.slice(0, 2).map((c) => (
                      <div key={c.name} className="rounded-xl aspect-square relative overflow-hidden flex items-end" style={{ background: cardBg }}>
                        <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '34px', opacity: 0.3 }}>{c.emoji}</div>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                        <span className="relative z-10 px-2 pb-1.5 font-bold" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '11px' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                  {/* Grande: Especiais */}
                  <div className="rounded-xl relative overflow-hidden flex items-end mb-1.5" style={{ aspectRatio: '16/7', background: cardBg }}>
                    <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '40px', opacity: 0.25 }}>{cats[2].emoji}</div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                    <span className="relative z-10 px-2.5 pb-2 font-bold" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '11px' }}>{cats[2].name}</span>
                  </div>
                  {/* Par 2: Bebidas + Petisco */}
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    {cats.slice(3, 5).map((c) => (
                      <div key={c.name} className="rounded-xl aspect-square relative overflow-hidden flex items-end" style={{ background: cardBg }}>
                        <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '34px', opacity: 0.3 }}>{c.emoji}</div>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                        <span className="relative z-10 px-2 pb-1.5 font-bold" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '11px' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                  {/* Grande: Drink */}
                  <div className="rounded-xl relative overflow-hidden flex items-end" style={{ aspectRatio: '16/7', background: cardBg }}>
                    <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: '40px', opacity: 0.25 }}>{cats[5].emoji}</div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
                    <span className="relative z-10 px-2.5 pb-2 font-bold" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '11px' }}>{cats[5].name}</span>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid rgba(128,128,128,0.12)' }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black" style={{ background: theme.primary_color, color: theme.text_color }}>
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold" style={{ color: theme.text_color, fontFamily: menuFont, fontSize: '11px' }}>{restaurant.name}</p>
                    <p style={{ color: theme.text_color, fontSize: '8px', opacity: 0.38 }}>© 2026 · Feito com HIVI</p>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pb-2.5 pt-1">
                  <div className="w-20 h-1 rounded-full" style={{ background: theme.text_color, opacity: 0.2 }} />
                </div>
              </div>
            )
          })()}
        </div>

        <SaveButton onClick={saveTheme} loading={themeSaving} saved={themeSaved} label="Salvar aparência" />
      </Section>

      {/* ── QR Code da loja ── */}
      <Section title="QR Code da Loja">
        <p className="text-sm text-gray-500 mb-4">
          Imprima e coloque nas mesas. Os clientes escaneiam para acessar o cardápio.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <QRCodeSVG
              id="menu-qrcode"
              value={menuUrl}
              size={180}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">{menuUrl}</p>
          <button
            onClick={downloadQr}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar QR Code (PNG)
          </button>
        </div>
      </Section>

      {/* ── Funcionários ── */}
      <Section title="Equipe">
        <p className="text-sm text-gray-500">
          {staffCount} {staffCount === 1 ? 'funcionário cadastrado' : 'funcionários cadastrados'}.
          O gerenciamento completo de funcionários (convite, roles) estará disponível em breve.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)] bg-gray-50"
          maxLength={7}
        />
      </div>
    </div>
  )
}

function SaveButton({
  onClick,
  loading,
  saved,
  label = 'Salvar',
}: {
  onClick: () => void
  loading: boolean
  saved: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="adm-btn-primary"
      style={saved ? { background: '#22c55e' } : undefined}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {saved && <Check className="w-4 h-4" />}
      {loading ? 'Salvando...' : saved ? 'Salvo!' : label}
    </button>
  )
}
