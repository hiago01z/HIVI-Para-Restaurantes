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
}

const PRESET_THEMES = [
  { name: 'Rústico', primary: '#FF6B00', secondary: '#1A0A00', bg: '#2C1A0E', font: 'serif' },
  { name: 'Moderno', primary: '#6366F1', secondary: '#0F172A', bg: '#1E293B', font: 'sans-serif' },
  { name: 'Claro',   primary: '#F97316', secondary: '#F3F4F6', bg: '#FFFFFF', font: 'sans-serif' },
  { name: 'Verde',   primary: '#10B981', secondary: '#064E3B', bg: '#022C22', font: 'serif' },
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
      <h1 className="text-xl font-black text-gray-900">Configurações</h1>

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
              className="relative w-full h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors overflow-hidden"
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="logo" fill className="object-contain p-2" />
              ) : (
                <div className="text-center">
                  {logoLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto" /> : (
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
              className="relative w-full h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors overflow-hidden"
            >
              {bannerPreview ? (
                <Image src={bannerPreview} alt="banner" fill className="object-cover" />
              ) : (
                <div className="text-center">
                  {bannerLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto" /> : (
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
                className="rounded-xl overflow-hidden border-2 border-transparent hover:border-orange-400 transition-all"
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
            label="Cor secundária"
            value={theme.secondary_color}
            onChange={(v) => setTheme((t) => ({ ...t, secondary_color: v }))}
          />
          <ColorField
            label="Cor de fundo"
            value={theme.background_color}
            onChange={(v) => setTheme((t) => ({ ...t, background_color: v }))}
          />
        </div>

        {/* Fonte */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Família de fonte</label>
          <select
            value={theme.font_family}
            onChange={(e) => setTheme((t) => ({ ...t, font_family: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Preview rápido */}
        <div
          className="rounded-2xl p-4 mb-4 text-center"
          style={{ background: theme.background_color, fontFamily: theme.font_family }}
        >
          <p className="text-sm font-bold" style={{ color: theme.primary_color }}>
            Destaques
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {restaurant.name} — prévia
          </p>
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
      <h2 className="font-black text-gray-900 text-base mb-4">{title}</h2>
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
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-400 bg-gray-50"
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
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
        saved ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'
      }`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {saved && <Check className="w-4 h-4" />}
      {loading ? 'Salvando...' : saved ? 'Salvo!' : label}
    </button>
  )
}
