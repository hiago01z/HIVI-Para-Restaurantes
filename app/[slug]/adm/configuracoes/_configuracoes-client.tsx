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

          {/* Phone frame */}
          <div
            className="mx-auto w-[270px] rounded-[2.25rem] overflow-hidden shadow-2xl"
            style={{
              background: theme.background_color,
              border: '5px solid #1f2937',
              fontFamily:
                theme.font_family === 'serif'      ? "'Playfair Display', Georgia, serif" :
                theme.font_family === 'sans-serif' ? "system-ui, sans-serif" :
                theme.font_family === 'monospace'  ? "'Courier New', monospace" :
                theme.font_family === 'cursive'    ? "Georgia, cursive" :
                theme.font_family,
            }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <span className="text-[9px] font-bold" style={{ color: theme.text_color, opacity: 0.7 }}>9:41</span>
              <div className="flex items-center gap-1" style={{ color: theme.text_color, opacity: 0.7 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M1.5 8.5a13 13 0 0121 0M5 12a10 10 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01"/></svg>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <div className="flex items-center gap-0.5">
                  <div className="w-3.5 h-2 rounded-sm border" style={{ borderColor: theme.text_color }}>
                    <div className="h-full rounded-sm w-3/4" style={{ background: theme.text_color }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Header do cardápio */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5"
              style={{ borderBottom: '1px solid rgba(128,128,128,0.15)', background: theme.background_color }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: theme.primary_color, color: theme.text_color }}
                >
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-semibold truncate max-w-[90px]" style={{ color: theme.text_color }}>
                  {restaurant.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5" style={{ color: theme.icon_color }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5" style={{ color: theme.icon_color }}>
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </div>
            </div>

            {/* Conteúdo scrollável */}
            <div className="px-2.5 pt-2.5 pb-3">

              {/* Carrossel destaque — quadrado */}
              <div
                className="relative w-full rounded-2xl overflow-hidden mb-3"
                style={{
                  aspectRatio: '1 / 1',
                  background: `color-mix(in srgb, ${theme.background_color} 65%, ${theme.text_color} 12%)`,
                }}
              >
                {/* Gradiente */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 50%, transparent 75%)' }}
                />
                {/* Emoji de prato (placeholder) */}
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20 select-none">
                  🍽️
                </div>
                {/* Pill de preço */}
                <div
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: theme.primary_color, color: theme.text_color }}
                >
                  R$ 29,90
                </div>
                {/* Dots de navegação */}
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                  <span className="block rounded-full" style={{ width: '16px', height: '5px', background: theme.primary_color }} />
                  <span className="block rounded-full opacity-35" style={{ width: '5px', height: '5px', background: theme.text_color }} />
                  <span className="block rounded-full opacity-35" style={{ width: '5px', height: '5px', background: theme.text_color }} />
                </div>
                {/* Info rodapé */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bold text-[13px] leading-tight mb-1" style={{ color: theme.text_color }}>
                    Nome do Prato em Destaque
                  </p>
                  <p className="text-[10px] mb-2.5 opacity-60" style={{ color: theme.text_color }}>
                    Descrição breve do prato especial
                  </p>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 py-2 rounded-xl text-center text-[11px] font-semibold"
                      style={{ background: theme.primary_color, color: theme.text_color }}
                    >
                      Pedir agora
                    </div>
                    <div
                      className="flex-1 py-2 rounded-xl text-center text-[11px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.15)', color: theme.text_color }}
                    >
                      Adicionar
                    </div>
                  </div>
                </div>
              </div>

              {/* Label Cardápio */}
              <p className="text-[12px] font-bold mb-2 tracking-tight" style={{ color: theme.primary_color }}>
                Cardápio
              </p>

              {/* Grid categorias: 2 pequenos */}
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                {['Combos', 'Bebidas'].map((n) => (
                  <div
                    key={n}
                    className="rounded-xl aspect-square relative overflow-hidden flex items-end"
                    style={{ background: `color-mix(in srgb, ${theme.background_color} 65%, ${theme.text_color} 12%)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-15 select-none">🍔</div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
                    <span className="relative z-10 px-2 pb-1.5 text-[11px] font-bold tracking-wide" style={{ color: theme.text_color }}>{n}</span>
                  </div>
                ))}
              </div>

              {/* Grid categorias: 1 grande */}
              <div
                className="rounded-xl relative overflow-hidden flex items-end"
                style={{
                  aspectRatio: '16 / 7',
                  background: `color-mix(in srgb, ${theme.background_color} 65%, ${theme.text_color} 12%)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-15 select-none">🍕</div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
                <span className="relative z-10 px-2.5 pb-2 text-[11px] font-bold tracking-wide" style={{ color: theme.text_color }}>Especiais</span>
              </div>
            </div>

            {/* Rodapé do cardápio */}
            <div className="px-3.5 pt-3 pb-2" style={{ borderTop: '1px solid rgba(128,128,128,0.12)' }}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: theme.primary_color, color: theme.text_color }}
                >
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: theme.text_color }}>
                  {restaurant.name}
                </p>
                <p className="text-[9px] opacity-40 font-medium" style={{ color: theme.text_color }}>
                  © 2026 · Feito com HIVI
                </p>
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center py-2">
              <div className="w-20 h-1 rounded-full opacity-25" style={{ background: theme.text_color }} />
            </div>
          </div>
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
