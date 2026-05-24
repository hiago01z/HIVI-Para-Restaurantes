'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Download, Instagram, Phone, Check, Send, AlertCircle, Clock, Printer } from 'lucide-react'
import {
  loadConfig, saveConfig, clearConfig, DEFAULT_CONFIG, DEFAULT_AGENT_URL,
  connectUsb, connectBluetooth, disconnectUsb, disconnectBluetooth,
  printTestOrder, isConnected, checkNetworkAgent,
  type PrinterConfig, type ConnectionType,
} from '@/lib/thermal-printer/printer'
import { QRCodeSVG } from 'qrcode.react'
import {
  type PixKeyType,
  validatePixKey,
  normalizePixKey,
  generatePixPayload,
  PIX_KEY_LABELS,
  PIX_KEY_PLACEHOLDERS,
} from '@/lib/pix'
import { CURRENCY_LABELS, type SupportedCurrency } from '@/lib/currency'
import { computeLabelShadow } from '@/lib/color-utils'
import {
  type DeliveryHoursConfig,
  type DaySchedule,
  DEFAULT_DELIVERY_HOURS,
  DAY_NAMES,
} from '@/lib/delivery-hours'

type Restaurant = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  instagram_url: string | null
  whatsapp_number: string | null
  whatsapp_notify_enabled: boolean
  is_active: boolean
  delivery_enabled: boolean
  delivery_hours: DeliveryHoursConfig
  pix_key: string | null
  pix_key_type: PixKeyType | null
  currency: SupportedCurrency
}

type Theme = {
  primary_color: string
  secondary_color: string
  background_color: string
  font_family: string
  font_size_base: string
  banner_url: string | null
  text_color: string
  icon_color: string
  // Label sobre imagem
  label_font: string
  label_color: string
  label_effect: string
  label_stroke_color: string
  label_stroke_size: number
  label_offset_distance: number
  label_offset_angle: number
}

const LABEL_FONT_OPTIONS = [
  { value: 'dancing-script',   label: 'Dancing Script' },
  { value: 'satisfy',          label: 'Satisfy' },
  { value: 'pacifico',         label: 'Pacifico' },
  { value: 'lobster',          label: 'Lobster' },
  { value: 'righteous',        label: 'Righteous' },
  { value: 'bebas-neue',       label: 'Bebas Neue' },
  { value: 'caveat',           label: 'Caveat' },
  { value: 'permanent-marker', label: 'Permanent Marker' },
  { value: 'yellowtail',       label: 'Yellowtail' },
  { value: 'menu',             label: 'Mesma do menu' },
  { value: 'system',           label: 'Sans-serif' },
]

const LABEL_EFFECT_OPTIONS = [
  { value: 'outline', label: 'Contorno' },
  { value: 'fill',    label: 'Fundo' },
  { value: 'offset',  label: 'Desalinhado' },
]

const LABEL_FONT_MAP: Record<string, string> = {
  'dancing-script':   "'Dancing Script', cursive",
  'satisfy':          "'Satisfy', cursive",
  'pacifico':         "'Pacifico', cursive",
  'lobster':          "'Lobster', cursive",
  'righteous':        "'Righteous', sans-serif",
  'bebas-neue':       "'Bebas Neue', sans-serif",
  'caveat':           "'Caveat', cursive",
  'permanent-marker': "'Permanent Marker', cursive",
  'yellowtail':       "'Yellowtail', cursive",
  'menu':             'inherit',
  'system':           'system-ui, sans-serif',
}

// Google Fonts para o preview do ADM (as mesmas que o layout carrega)
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Satisfy&family=Pacifico&family=Lobster&family=Righteous&family=Bebas+Neue&family=Caveat:wght@700&family=Permanent+Marker&family=Yellowtail&display=swap"

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
  currentRole,
}: {
  restaurant: Restaurant
  theme: Theme
  staffCount: number
  currentRole: string
}) {
  const router = useRouter()
  // Supabase browser client — usado APENAS para upload de imagens no Storage
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Helper: chama a API de settings do ADM (bypassa RLS via service role)
  async function patchSettings(fields: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/adm/${restaurant.slug}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.status === 401) { router.push(`/${restaurant.slug}/adm/login`); return false }
    return res.ok
  }

  // Helper: chama a API de tema do ADM
  async function patchTheme(fields: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/adm/${restaurant.slug}/theme`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.status === 401) { router.push(`/${restaurant.slug}/adm/login`); return false }
    return res.ok
  }

  // Nome do restaurante
  const [restaurantName, setRestaurantName] = useState(restaurant.name)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  async function saveName() {
    if (!restaurantName.trim()) { setNameError('O nome não pode estar vazio.'); return }
    setNameSaving(true)
    setNameError('')
    try {
      const ok = await patchSettings({ name: restaurantName.trim() })
      if (ok) {
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2000)
      } else {
        setNameError('Erro ao salvar. Tente novamente.')
      }
    } catch {
      setNameError('Erro de conexão. Tente novamente.')
    } finally {
      setNameSaving(false)
    }
  }

  // Moeda
  const isOwner = currentRole === 'owner'
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(restaurant.currency ?? 'BRL')
  const [currencySaving, setCurrencySaving]     = useState(false)
  const [currencySaved, setCurrencySaved]       = useState(false)

  async function saveCurrency(value: SupportedCurrency) {
    setSelectedCurrency(value)
    setCurrencySaving(true)
    try {
      const ok = await patchSettings({ currency: value })
      if (ok) { setCurrencySaved(true); setTimeout(() => setCurrencySaved(false), 2000) }
    } catch { /* silencia — estado visual permanece */ }
    finally { setCurrencySaving(false) }
  }

  // PIX
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(restaurant.pix_key_type ?? 'evp')
  const [pixKey, setPixKey]         = useState(
    restaurant.pix_key ?? (restaurant.pix_key_type === 'phone' ? '+55' : '')
  )
  const [pixSaving, setPixSaving]   = useState(false)
  const [pixSaved, setPixSaved]     = useState(false)
  const [pixError, setPixError]     = useState('')
  const [pixTestPayload, setPixTestPayload] = useState<string | null>(null)
  const [pixCopied, setPixCopied]   = useState(false)

  const pixValid = pixKey.trim() !== '' && validatePixKey(pixKeyType, pixKey)

  async function savePix() {
    if (!pixValid) { setPixError('Chave PIX inválida para o tipo selecionado.'); return }
    setPixSaving(true); setPixError('')
    try {
      const normalized = normalizePixKey(pixKeyType, pixKey)
      const ok = await patchSettings({ pix_key: normalized, pix_key_type: pixKeyType })
      if (ok) { setPixKey(normalized); setPixSaved(true); setTimeout(() => setPixSaved(false), 2000) }
      else setPixError('Erro ao salvar. Tente novamente.')
    } catch { setPixError('Erro de conexão.') }
    finally { setPixSaving(false) }
  }

  function generateTestQr() {
    const payload = generatePixPayload({
      key: normalizePixKey(pixKeyType, pixKey),
      merchantName: restaurant.name,
      amount: 0.10,
      txid: 'TESTE',
      description: 'Teste HIVI',
    })
    setPixTestPayload(payload)
  }

  async function copyPixPayload(payload: string) {
    await navigator.clipboard.writeText(payload)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2000)
  }

  // Ativar/desativar entregas
  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant.delivery_enabled)
  const [deliveryEnabledSaving, setDeliveryEnabledSaving] = useState(false)

  async function toggleDeliveryEnabled() {
    const newValue = !deliveryEnabled
    setDeliveryEnabledSaving(true)
    try {
      await patchSettings({ delivery_enabled: newValue })
      setDeliveryEnabled(newValue)
    } catch {
      // mantém estado anterior em caso de erro
    } finally {
      setDeliveryEnabledSaving(false)
    }
  }

  // Horário de entregas
  const [deliveryHours, setDeliveryHours] = useState<DeliveryHoursConfig>(
    restaurant.delivery_hours ?? DEFAULT_DELIVERY_HOURS
  )
  const [hoursSaving, setHoursSaving] = useState(false)
  const [hoursSaved, setHoursSaved] = useState(false)
  const [hoursError, setHoursError] = useState('')

  async function saveDeliveryHours() {
    setHoursSaving(true)
    setHoursError('')
    try {
      const ok = await patchSettings({ delivery_hours: deliveryHours })
      if (ok) {
        setHoursSaved(true)
        setTimeout(() => setHoursSaved(false), 2000)
      } else {
        setHoursError('Erro ao salvar. Tente novamente.')
      }
    } catch {
      setHoursError('Erro de conexão. Tente novamente.')
    } finally {
      setHoursSaving(false)
    }
  }

  function updateDay(dayKey: string, patch: Partial<DaySchedule>) {
    setDeliveryHours((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: { ...(prev.days[dayKey] ?? { open: true, from: '10:00', to: '22:00' }), ...patch },
      },
    }))
  }

  // Status do restaurante
  const [isActive, setIsActive] = useState(restaurant.is_active)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  // Redes sociais
  const [instagram, setInstagram] = useState(restaurant.instagram_url ?? '')
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp_number ?? '')
  const [wppNotify, setWppNotify] = useState(restaurant.whatsapp_notify_enabled)
  const [socialSaving, setSocialSaving] = useState(false)
  const [socialSaved, setSocialSaved] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [wppTestLoading, setWppTestLoading] = useState(false)
  const [wppTestResult, setWppTestResult] = useState<'sent' | 'error' | null>(null)
  const [wppTestError, setWppTestError] = useState('')

  // Tema
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)
  const [themeError, setThemeError] = useState('')

  // Iframe da prévia
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fontMap: Record<string, string> = {
    'serif':      "'Playfair Display', Georgia, serif",
    'sans-serif': "system-ui, sans-serif",
    'monospace':  "'Courier New', monospace",
    'cursive':    "Georgia, cursive",
  }

  const sendThemeToIframe = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const labelTextShadow = computeLabelShadow(
      theme.label_effect,
      theme.label_stroke_color,
      theme.label_stroke_size,
      theme.label_offset_distance,
      theme.label_offset_angle,
    )
    iframe.contentWindow.postMessage(
      {
        type: 'HIVI_THEME_PREVIEW',
        theme: {
          primary:         theme.primary_color,
          secondary:       theme.secondary_color,
          bg:              theme.background_color,
          text:            theme.text_color,
          icon:            theme.icon_color,
          font:            fontMap[theme.font_family] ?? theme.font_family,
          labelFont:       LABEL_FONT_MAP[theme.label_font] ?? 'inherit',
          labelColor:      theme.label_color,
          labelTextShadow: labelTextShadow,
        },
      },
      window.location.origin
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  // Envia tema sempre que o usuário alterar qualquer cor/fonte
  useEffect(() => { sendThemeToIframe() }, [sendThemeToIframe])

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo_url)
  const [logoLoading, setLogoLoading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  // Banner
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialTheme.banner_url)
  const [bannerLoading, setBannerLoading] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)

  // QR Code
  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${restaurant.slug}`
    : `https://hivi-web.com/${restaurant.slug}`

  async function toggleStatus() {
    const newValue = !isActive
    setStatusSaving(true)
    setStatusError('')
    try {
      const ok = await patchSettings({ is_active: newValue })
      if (ok) {
        setIsActive(newValue)
      } else {
        setStatusError('Erro ao alterar status. Tente novamente.')
      }
    } catch {
      setStatusError('Erro de conexão. Tente novamente.')
    } finally {
      setStatusSaving(false)
    }
  }

  async function saveSocial() {
    setSocialSaving(true)
    setSocialError('')
    try {
      const ok = await patchSettings({
        instagram_url: instagram.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        whatsapp_notify_enabled: wppNotify,
      })
      if (ok) {
        setSocialSaved(true)
        setTimeout(() => setSocialSaved(false), 2000)
      } else {
        setSocialError('Erro ao salvar. Tente novamente.')
      }
    } catch {
      setSocialError('Erro de conexão. Tente novamente.')
    } finally {
      setSocialSaving(false)
    }
  }

  async function handleTestWhatsApp() {
    if (!whatsapp.trim()) {
      setSocialError('Configure e salve o número de WhatsApp antes de testar.')
      return
    }
    setWppTestLoading(true)
    setWppTestResult(null)
    setWppTestError('')
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: restaurant.slug, restaurantId: restaurant.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setWppTestResult('sent')
      } else {
        setWppTestResult('error')
        setWppTestError(data.error ?? 'Falha ao enviar.')
      }
    } catch {
      setWppTestResult('error')
      setWppTestError('Erro de conexão.')
    } finally {
      setWppTestLoading(false)
    }
  }

  async function saveTheme() {
    setThemeSaving(true)
    setThemeError('')
    try {
      const ok = await patchTheme({
        primary_color:          theme.primary_color,
        secondary_color:        theme.secondary_color,
        background_color:       theme.background_color,
        font_family:            theme.font_family,
        font_size_base:         theme.font_size_base,
        banner_url:             theme.banner_url,
        text_color:             theme.text_color,
        icon_color:             theme.icon_color,
        label_font:             theme.label_font,
        label_color:            theme.label_color,
        label_effect:           theme.label_effect,
        label_stroke_color:     theme.label_stroke_color,
        label_stroke_size:      theme.label_stroke_size,
        label_offset_distance:  theme.label_offset_distance,
        label_offset_angle:     theme.label_offset_angle,
      })
      if (ok) {
        setThemeSaved(true)
        setTimeout(() => setThemeSaved(false), 2000)
      } else {
        setThemeError('Erro ao salvar tema. Tente novamente.')
      }
    } catch {
      setThemeError('Erro de conexão. Tente novamente.')
    } finally {
      setThemeSaving(false)
    }
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
    // Reseta o input para permitir re-selecionar o mesmo arquivo
    if (logoRef.current) logoRef.current.value = ''
    try {
      const ext = file.name.split('.').pop()
      // Inclui timestamp no nome para forçar cache-bust no browser
      const path = `${restaurant.id}/logo-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('restaurant-images')
        .upload(path, file, { upsert: true })
      if (error) return
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
      setLogoPreview(data.publicUrl)
      await patchSettings({ logo_url: data.publicUrl })
    } finally {
      setLogoLoading(false)
    }
  }

  async function uploadBanner(file: File) {
    setBannerLoading(true)
    if (bannerRef.current) bannerRef.current.value = ''
    try {
      const ext = file.name.split('.').pop()
      const path = `${restaurant.id}/banner-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('restaurant-images')
        .upload(path, file, { upsert: true })
      if (error) return
      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
      setBannerPreview(data.publicUrl)
      setTheme((prev) => ({ ...prev, banner_url: data.publicUrl }))
      await patchTheme({ banner_url: data.publicUrl })
    } finally {
      setBannerLoading(false)
    }
  }

  async function removeBanner() {
    setBannerPreview(null)
    setTheme((prev) => ({ ...prev, banner_url: null }))
    await patchTheme({ banner_url: null })
  }

  // ── Impressora térmica ─────────────────────────────────────────────────────
  const [printerCfg, setPrinterCfg] = useState<PrinterConfig>(() => loadConfig() ?? DEFAULT_CONFIG)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [printerConnecting, setPrinterConnecting] = useState(false)
  const [printerTesting, setPrinterTesting] = useState(false)
  const [printerTestOk, setPrinterTestOk] = useState(false)
  const [printerError, setPrinterError] = useState('')
  const [agentStatus, setAgentStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [agentChecking, setAgentChecking] = useState(false)

  // Check connection status on mount
  useEffect(() => {
    const cfg = loadConfig()
    if (!cfg) return
    setPrinterCfg(cfg)
    if (cfg.type === 'browser' || cfg.type === 'network') {
      setPrinterConnected(true)
    } else {
      setPrinterConnected(isConnected(cfg.type))
    }
  }, [])

  function updatePrinterCfg(patch: Partial<PrinterConfig>) {
    const next = { ...printerCfg, ...patch }
    setPrinterCfg(next)
    saveConfig(next)
  }

  function handleChangePrinterType(type: ConnectionType) {
    // Disconnect old
    if (printerCfg.type === 'usb') disconnectUsb()
    else if (printerCfg.type === 'bluetooth') disconnectBluetooth()
    setPrinterConnected(false)
    setPrinterError('')
    updatePrinterCfg({ type })
  }

  async function handleConnectPrinter() {
    // Browser/network mode: no device pairing needed
    if (printerCfg.type === 'browser' || printerCfg.type === 'network') {
      setPrinterConnected(true)
      return
    }
    setPrinterConnecting(true)
    setPrinterError('')
    try {
      if (printerCfg.type === 'usb') await connectUsb()
      else await connectBluetooth()
      setPrinterConnected(true)
    } catch (e) {
      setPrinterError(e instanceof Error ? e.message : 'Erro ao conectar.')
      setPrinterConnected(false)
    } finally {
      setPrinterConnecting(false)
    }
  }

  async function handleCheckAgent() {
    setAgentChecking(true)
    setAgentStatus('unknown')
    const ok = await checkNetworkAgent(printerCfg.agentUrl ?? DEFAULT_AGENT_URL)
    setAgentStatus(ok ? 'online' : 'offline')
    setAgentChecking(false)
    if (ok) setPrinterConnected(true)
  }

  async function handleTestPrint() {
    setPrinterTesting(true)
    setPrinterError('')
    try {
      await printTestOrder(printerCfg, restaurant.name)
      setPrinterTestOk(true)
      setTimeout(() => setPrinterTestOk(false), 3000)
    } catch (e) {
      setPrinterError(e instanceof Error ? e.message : 'Erro ao imprimir.')
    } finally {
      setPrinterTesting(false)
    }
  }

  function handleDisconnectPrinter() {
    if (printerCfg.type === 'usb') disconnectUsb()
    else if (printerCfg.type === 'bluetooth') disconnectBluetooth()
    clearConfig()
    setPrinterConnected(false)
    setPrinterCfg(DEFAULT_CONFIG)
    setPrinterError('')
    setAgentStatus('unknown')
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
      {/* Carrega fontes decorativas para o preview inline do ADM */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>

      {/* ── Informações Gerais ── */}
      <Section title="Informações Gerais">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do restaurante
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => { setRestaurantName(e.target.value); setNameError('') }}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              maxLength={100}
              placeholder="Nome do seu restaurante"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Aparece no cardápio público, pedidos e painel.
            </p>
          </div>
          {nameError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{nameError}</p>
          )}
          <button
            onClick={saveName}
            disabled={nameSaving || restaurantName.trim() === restaurant.name}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--adm-primary)' }}
          >
            {nameSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : nameSaved ? (
              <><Check className="w-4 h-4" /> Salvo!</>
            ) : (
              'Salvar nome'
            )}
          </button>
        </div>
      </Section>

      {/* ── Moeda ── */}
      {isOwner && (
        <Section title={
          <span className="flex items-center gap-2">
            Moeda
            {currencySaved && (
              <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Salvo</span>
            )}
          </span>
        }>
          <p className="text-sm text-gray-500 mb-4">
            Define como os preços são exibidos no cardápio e no painel para os clientes e equipe.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(CURRENCY_LABELS) as [SupportedCurrency, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => saveCurrency(code)}
                disabled={currencySaving}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-colors text-left disabled:opacity-60 ${
                  selectedCurrency === code
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg block mb-0.5">{code === 'EUR' ? '🇵🇹' : '🇧🇷'}</span>
                {label}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── PIX ── */}
      <Section title={
        <span className="flex items-center gap-2">
          PIX
          {!isOwner && (
            <span className="flex items-center gap-1 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              🔒 Apenas o dono pode editar
            </span>
          )}
          {isOwner && restaurant.pix_key && (
            <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Configurado</span>
          )}
        </span>
      }>
        <fieldset disabled={!isOwner} className={!isOwner ? 'opacity-50 cursor-not-allowed select-none' : ''}>
          <div className="space-y-4">
            {/* Tipo de chave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de chave</label>
              <select
                value={pixKeyType}
                onChange={(e) => {
                  const newType = e.target.value as PixKeyType
                  setPixKeyType(newType)
                  setPixKey(newType === 'phone' ? '+55' : '')
                  setPixError('')
                }}
                disabled={!isOwner}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
              >
                {(Object.keys(PIX_KEY_LABELS) as PixKeyType[]).map((t) => (
                  <option key={t} value={t}>{PIX_KEY_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Chave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Chave PIX ({PIX_KEY_LABELS[pixKeyType]})
              </label>
              <input
                type={pixKeyType === 'email' ? 'email' : 'text'}
                value={pixKey}
                onChange={(e) => {
                  let val = e.target.value
                  if (pixKeyType === 'phone') {
                    if (!val.startsWith('+55')) val = '+55' + val.replace(/^\+?5?5?/, '')
                  }
                  setPixKey(val)
                  setPixError('')
                }}
                placeholder={PIX_KEY_PLACEHOLDERS[pixKeyType]}
                disabled={!isOwner}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
              />
              {pixKey && !pixValid && (
                <p className="text-xs text-amber-600 mt-1">
                  {pixKeyType === 'cpf'   && 'CPF inválido. Use o formato 000.000.000-00'}
                  {pixKeyType === 'cnpj'  && 'CNPJ inválido. Use o formato 00.000.000/0001-00'}
                  {pixKeyType === 'email' && 'E-mail inválido.'}
                  {pixKeyType === 'phone' && 'Telefone inválido. Use +55 11 99999-9999'}
                  {pixKeyType === 'evp'   && 'Chave aleatória inválida. Copie exatamente do seu banco.'}
                </p>
              )}
              {pixKey && pixValid && (
                <p className="text-xs text-green-600 mt-1">✓ Chave válida</p>
              )}
            </div>

            {pixError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{pixError}</p>
            )}

            {/* Botões */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={savePix}
                disabled={!isOwner || pixSaving || !pixValid}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: 'var(--adm-primary)' }}
              >
                {pixSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pixSaved ? <><Check className="w-4 h-4" /> Salvo!</> : 'Salvar chave PIX'}
              </button>

              <button
                onClick={generateTestQr}
                disabled={!isOwner || !pixValid}
                title="Gera um QR code de R$ 0,10 para testar"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Testar QR Code (R$ 0,10)
              </button>
            </div>
          </div>
        </fieldset>

        {/* Modal do QR de teste */}
        {pixTestPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPixTestPayload(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-gray-900 mb-1">QR Code PIX — Teste</p>
              <p className="text-xs text-gray-500 mb-4">Valor: <strong>R$ 0,10</strong> · Chave: {PIX_KEY_LABELS[pixKeyType]}</p>
              <div className="flex justify-center mb-4">
                <QRCodeSVG value={pixTestPayload} size={200} />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1 font-medium">Copia e Cola:</p>
                <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">{pixTestPayload}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyPixPayload(pixTestPayload)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  {pixCopied ? '✓ Copiado!' : 'Copiar código'}
                </button>
                <button
                  onClick={() => setPixTestPayload(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--adm-primary)' }}
                >
                  Fechar
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">Clique fora para fechar</p>
            </div>
          </div>
        )}
      </Section>

      {/* ── Status do restaurante ── */}
      <Section title="Status do Cardápio">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              {isActive ? '🟢 Cardápio ativo' : '🔴 Cardápio pausado'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive
                ? 'Clientes conseguem acessar e fazer pedidos.'
                : 'O cardápio está oculto. Clientes verão uma tela de pausa.'}
            </p>
          </div>
          <button
            onClick={toggleStatus}
            disabled={statusSaving}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none"
            style={{
              background: isActive ? 'var(--adm-primary)' : '#d1d5db',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: isActive ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>
        {statusError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{statusError}</p>
        )}
      </Section>

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
            {/* Toggle de notificação de novo pedido */}
            <div className="flex items-center justify-between mt-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Notificar novo pedido</p>
                <p className="text-xs text-gray-400 mt-0.5">Envia mensagem no WhatsApp ao receber pedido de entrega</p>
              </div>
              <button
                type="button"
                onClick={() => setWppNotify((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wppNotify ? 'bg-green-500' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={wppNotify}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wppNotify ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            {/* Botão de teste de notificação */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={wppTestLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {wppTestLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  : <Send className="w-4 h-4 text-green-500" />
                }
                Testar notificação
              </button>
              {wppTestResult === 'sent' && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Check className="w-3.5 h-3.5" /> Mensagem enviada para o número configurado!
                </span>
              )}
              {wppTestResult === 'error' && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {wppTestError}
                </span>
              )}
            </div>
          </div>
          {socialError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{socialError}</p>
          )}
          <SaveButton onClick={saveSocial} loading={socialSaving} saved={socialSaved} />
        </div>
      </Section>

      {/* ── Horário de Entregas ── */}
      <Section title="Entregas">
        {/* Toggle: aceitar entregas */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Aceitar pedidos de entrega</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Quando desativado, o botão de entrega some do cardápio.
            </p>
          </div>
          <button
            onClick={toggleDeliveryEnabled}
            disabled={deliveryEnabledSaving}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none disabled:opacity-60"
            style={{ background: deliveryEnabled ? 'var(--adm-primary)' : '#d1d5db' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: deliveryEnabled ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Conteúdo de horário — visível apenas se entregas estiver ativo */}
        {deliveryEnabled && (<>
        {/* Toggle: controle de horário */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: 'var(--adm-primary)' }} />
              Controle de horário
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Quando ativado, a opção de entrega fica bloqueada para clientes fora do horário.
            </p>
          </div>
          <button
            onClick={() => setDeliveryHours((p) => ({ ...p, enabled: !p.enabled }))}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none"
            style={{ background: deliveryHours.enabled ? 'var(--adm-primary)' : '#d1d5db' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: deliveryHours.enabled ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {deliveryHours.enabled && (
          <div className="space-y-4 pt-3 border-t border-gray-100">
            {/* Modo: mesmo horário vs por dia */}
            <div className="flex gap-3">
              {[
                { value: true,  label: 'Mesmo horário todos os dias' },
                { value: false, label: 'Horários diferentes por dia' },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setDeliveryHours((p) => ({ ...p, sameForAll: opt.value }))}
                  className="flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all text-left"
                  style={deliveryHours.sameForAll === opt.value ? {
                    borderColor: 'var(--adm-primary)',
                    color: 'var(--adm-primary)',
                    background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                  } : { borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Modo: mesmo horário todos os dias */}
            {deliveryHours.sameForAll && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 flex-shrink-0">Funciona das</span>
                <input
                  type="time"
                  value={deliveryHours.allFrom}
                  onChange={(e) => setDeliveryHours((p) => ({ ...p, allFrom: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
                />
                <span className="text-sm text-gray-600">às</span>
                <input
                  type="time"
                  value={deliveryHours.allTo}
                  onChange={(e) => setDeliveryHours((p) => ({ ...p, allTo: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
                />
              </div>
            )}

            {/* Modo: horários por dia */}
            {!deliveryHours.sameForAll && (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                  const key = String(d)
                  const day = deliveryHours.days[key] ?? { open: true, from: '10:00', to: '22:00' }
                  return (
                    <div key={d} className="flex items-center gap-3">
                      {/* Dia + toggle */}
                      <button
                        onClick={() => updateDay(key, { open: !day.open })}
                        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none"
                        style={{ background: day.open ? 'var(--adm-primary)' : '#d1d5db' }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                          style={{ transform: day.open ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                      <span
                        className="text-sm font-semibold w-8 flex-shrink-0"
                        style={{ color: day.open ? '#111827' : '#9ca3af' }}
                      >
                        {DAY_NAMES[d]}
                      </span>
                      {day.open ? (
                        <>
                          <input
                            type="time"
                            value={day.from}
                            onChange={(e) => updateDay(key, { from: e.target.value })}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
                          />
                          <span className="text-xs text-gray-400">às</span>
                          <input
                            type="time"
                            value={day.to}
                            onChange={(e) => updateDay(key, { to: e.target.value })}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
                          />
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">fechado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {hoursError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{hoursError}</p>
        )}
        <div className="mt-4">
          <SaveButton onClick={saveDeliveryHours} loading={hoursSaving} saved={hoursSaved} label="Salvar horários" />
        </div>
        </>)}
      </Section>

      {/* ── Logo ── */}
      <Section title="Logo">
        <p className="text-xs text-gray-400 mb-3">
          Formatos aceitos: PNG, JPG, SVG, WEBP. Recomendado: fundo transparente (PNG).
        </p>
        <div
          onClick={() => logoRef.current?.click()}
          className="adm-upload-area h-36 cursor-pointer"
        >
          {logoLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--adm-primary)' }} />
          ) : logoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoPreview}
              alt="logo"
              className="max-h-28 max-w-full object-contain"
            />
          ) : (
            <div className="text-center">
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">Clique para enviar o logo</p>
              <p className="text-xs text-gray-300 mt-1">PNG com fundo transparente funciona melhor</p>
            </div>
          )}
        </div>
        {logoPreview && (
          <button
            onClick={() => { setLogoPreview(null); patchSettings({ logo_url: null }) }}
            className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Remover logo
          </button>
        )}
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
        />
      </Section>

      {/* ── Banner ── */}
      <Section title="Banner do Cardápio">
        <p className="text-xs text-gray-400 mb-3">
          Imagem de destaque exibida no topo do cardápio. Recomendado: 1200×400 px (paisagem).
        </p>
        <div
          onClick={() => bannerRef.current?.click()}
          className="adm-upload-area cursor-pointer overflow-hidden"
          style={{ height: bannerPreview ? '120px' : '100px', padding: 0 }}
        >
          {bannerLoading ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--adm-primary)' }} />
            </div>
          ) : bannerPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={bannerPreview}
              alt="banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <Upload className="w-6 h-6 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400 font-medium">Clique para enviar o banner</p>
              <p className="text-xs text-gray-300 mt-1">Recomendado: 1200×400 px (paisagem)</p>
            </div>
          )}
        </div>
        {bannerPreview && (
          <button
            onClick={removeBanner}
            className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Remover banner
          </button>
        )}
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f) }}
        />
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

        {/* Tamanho da fonte */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tamanho da fonte</label>
          <div className="flex gap-2">
            {[
              { value: '14px', label: 'Pequena' },
              { value: '16px', label: 'Normal' },
              { value: '18px', label: 'Grande' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme((t) => ({ ...t, font_size_base: opt.value }))}
                className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                style={theme.font_size_base === opt.value ? {
                  borderColor: 'var(--adm-primary)',
                  color: 'var(--adm-primary)',
                  background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                } : { borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Texto sobre imagens ── */}
        <div className="mb-5 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Texto sobre imagens</p>
          <p className="text-xs text-gray-400 mb-4">
            Estilo das nomenclaturas de categorias e destaques exibidas sobre fotos.
          </p>

          {/* Fonte do label */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fonte</label>
            <select
              value={theme.label_font}
              onChange={(e) => setTheme((t) => ({ ...t, label_font: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
            >
              {LABEL_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Cor do texto + Cor do efeito */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ColorField
              label="Cor do texto"
              value={theme.label_color}
              onChange={(v) => setTheme((t) => ({ ...t, label_color: v }))}
            />
            <ColorField
              label="Cor do efeito"
              value={theme.label_stroke_color}
              onChange={(v) => setTheme((t) => ({ ...t, label_stroke_color: v }))}
            />
          </div>

          {/* Tipo de efeito */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de efeito</label>
            <div className="grid grid-cols-3 gap-2">
              {LABEL_EFFECT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme((t) => ({ ...t, label_effect: opt.value }))}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    theme.label_effect === opt.value ? '' : 'border-gray-100 text-gray-500 bg-white'
                  }`}
                  style={theme.label_effect === opt.value ? {
                    borderColor: 'var(--adm-primary)',
                    color: 'var(--adm-primary)',
                    background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                  } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview do label */}
          <div
            className="relative rounded-xl overflow-hidden mb-4 flex items-center justify-center"
            style={{ height: '80px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
          >
            <span
              style={{
                fontFamily: LABEL_FONT_MAP[theme.label_font] ?? 'inherit',
                color: theme.label_color,
                textShadow: computeLabelShadow(
                  theme.label_effect, theme.label_stroke_color,
                  theme.label_stroke_size, theme.label_offset_distance, theme.label_offset_angle
                ),
                fontSize: '1.5rem',
              }}
            >
              Combos
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <SliderField
              label="Espessura"
              value={theme.label_stroke_size}
              min={0} max={100}
              onChange={(v) => setTheme((t) => ({ ...t, label_stroke_size: v }))}
            />
            {theme.label_effect === 'offset' && (
              <>
                <SliderField
                  label="Distância"
                  value={theme.label_offset_distance}
                  min={0} max={100}
                  onChange={(v) => setTheme((t) => ({ ...t, label_offset_distance: v }))}
                />
                <SliderField
                  label="Direção"
                  value={theme.label_offset_angle}
                  min={-180} max={180}
                  onChange={(v) => setTheme((t) => ({ ...t, label_offset_angle: v }))}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Prévia ao vivo — iframe do cardápio real ── */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Prévia em tempo real
          </p>

          {/* Frame do celular */}
          <div
            className="mx-auto shadow-2xl flex-shrink-0"
            style={{
              width: '292px',           // 280px tela + 6px borda cada lado
              background: '#111827',
              border: '6px solid #111827',
              borderRadius: '2.5rem',
              padding: '14px 0 10px',
              position: 'relative',
            }}
          >
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '88px', height: '22px',
              background: '#111827',
              borderRadius: '0 0 14px 14px',
              zIndex: 10,
            }} />

            {/* Tela */}
            <div style={{
              width: '280px',
              height: '607px',
              overflow: 'hidden',
              borderRadius: '1.75rem',
              position: 'relative',
              background: '#000',
            }}>
              <iframe
                ref={iframeRef}
                src={`/${restaurant.slug}`}
                onLoad={sendThemeToIframe}
                title="Prévia do cardápio"
                style={{
                  width: '390px',
                  height: '844px',
                  transform: 'scale(0.71795)',
                  transformOrigin: 'top left',
                  border: 'none',
                  pointerEvents: 'none',
                  display: 'block',
                }}
              />
              {/* Overlay invisível para garantir ininteratividade */}
              <div style={{
                position: 'absolute', inset: 0,
                zIndex: 5,
                cursor: 'default',
              }} />
            </div>

            {/* Home indicator */}
            <div style={{
              width: '80px', height: '4px',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '2px',
              margin: '10px auto 0',
            }} />
          </div>
        </div>

        {themeError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-2">{themeError}</p>
        )}
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

      {/* ── Impressora Térmica ── */}
      <Section title="Impressora Térmica">
        <p className="text-xs text-gray-400 mb-4">
          Configure uma impressora para imprimir cupons automaticamente quando novos pedidos chegarem.
        </p>

        {/* Tipo de conexão */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Como a impressora está conectada?</p>
          <div className="grid grid-cols-4 gap-2">
            {([
              { type: 'usb',       icon: '🔌', label: 'Cabo USB' },
              { type: 'bluetooth', icon: '📶', label: 'Bluetooth' },
              { type: 'network',   icon: '🌐', label: 'Rede' },
              { type: 'browser',   icon: '🖨️', label: 'Via sistema' },
            ] as { type: ConnectionType; icon: string; label: string }[]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleChangePrinterType(opt.type)}
                className="py-2.5 px-1 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1"
                style={printerCfg.type === opt.type ? {
                  borderColor: 'var(--adm-primary)',
                  color: 'var(--adm-primary)',
                  background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                } : { borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
          {printerCfg.type === 'browser' && (
            <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2 select-none list-none">
                📋 Como configurar — passo a passo
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-gray-700 space-y-2">
                <p className="font-bold text-gray-800">Antes de imprimir, configure o tamanho do papel no Windows:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Abra o <strong>Painel de Controle → Dispositivos e Impressoras</strong></li>
                  <li>Clique com o botão direito na sua impressora térmica → <strong>Preferências de impressão</strong></li>
                  <li>Na aba <strong>Papel</strong>, selecione <strong>58mm Roll</strong> ou <strong>80mm Roll</strong> (depende do seu modelo)</li>
                  <li>Clique em <strong>OK</strong> e salve</li>
                </ol>
                <p className="font-bold text-gray-800 pt-1">Para imprimir pelo HIVI:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Clique em <strong>Imprimir teste</strong> abaixo</li>
                  <li>Na janela que abrir, selecione sua impressora térmica em <strong>Destino</strong></li>
                  <li>Verifique se o tamanho do papel está correto (58mm ou 80mm)</li>
                  <li>Clique em <strong>Imprimir</strong></li>
                </ol>
                <p className="text-gray-500 pt-1">💡 O navegador lembra a impressora escolhida — próximas impressões serão automáticas.</p>
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  ⚠️ <strong>Imprimindo errado?</strong> O problema mais comum é o tamanho do papel. Confira se selecionou <strong>58mm</strong> ou <strong>80mm</strong> nas preferências da impressora — não deixe em A4.
                </p>
              </div>
            </details>
          )}
          {printerCfg.type === 'usb' && (
            <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2 select-none list-none">
                📋 Como configurar — passo a passo
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-gray-700 space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Conecte o <strong>cabo USB</strong> da impressora ao computador</li>
                  <li>Use o navegador <strong>Google Chrome</strong> (não funciona em Firefox ou Edge)</li>
                  <li>Clique no botão <strong>&ldquo;Conectar&rdquo;</strong> acima</li>
                  <li>Na janela do Chrome, procure sua impressora na lista e clique em <strong>Conectar</strong></li>
                  <li>Clique em <strong>Imprimir teste</strong> para confirmar</li>
                </ol>
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  ⚠️ <strong>Erro &ldquo;Access denied&rdquo; ou impressora não aparece?</strong> O Windows instalou um driver que bloqueia o acesso direto. Solução: baixe o <strong>Zadig</strong> (zadig.akeo.ie), selecione a impressora e troque o driver para <strong>WinUSB</strong>. Depois reconecte.
                </p>
                <p className="text-gray-500">💡 Neste modo, a conexão USB se perde ao recarregar a página. Clique em &ldquo;Conectar&rdquo; novamente se isso acontecer.</p>
              </div>
            </details>
          )}
          {printerCfg.type === 'bluetooth' && (
            <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2 select-none list-none">
                📋 Como configurar — passo a passo
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-gray-700 space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Ligue a impressora e coloque-a em modo de emparelhamento (normalmente uma <strong>luz azul piscando</strong> — veja o manual)</li>
                  <li>No Windows: <strong>Configurações → Bluetooth e outros dispositivos → Adicionar dispositivo</strong>. Selecione a impressora e emparelhe</li>
                  <li>Use o navegador <strong>Google Chrome</strong></li>
                  <li>Clique em <strong>&ldquo;Conectar&rdquo;</strong> acima</li>
                  <li>Na lista do Chrome, selecione sua impressora e clique em <strong>Conectar</strong></li>
                  <li>Clique em <strong>Imprimir teste</strong> para confirmar</li>
                </ol>
                <p className="text-gray-500">💡 A conexão Bluetooth se perde ao recarregar a página. Clique em &ldquo;Conectar&rdquo; novamente se necessário.</p>
              </div>
            </details>
          )}
          {printerCfg.type === 'network' && (
            <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2 select-none list-none">
                📋 Como configurar — passo a passo
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-gray-700 space-y-2">
                <p className="font-bold text-gray-800">Pré-requisito: Node.js instalado no computador do restaurante</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Descubra o <strong>IP da impressora</strong>: segure o botão de alimentação por 3 segundos — ela imprime uma folha com as configurações, incluindo o IP</li>
                  <li>Baixe o arquivo <code className="bg-white border border-gray-200 px-1 rounded">hivi-print-agent.js</code> (disponível em <strong>hivi-web.com/downloads</strong>)</li>
                  <li>Abra o <strong>Prompt de Comando</strong> (pressione Win+R, digite <code className="bg-white border border-gray-200 px-1 rounded">cmd</code>)</li>
                  <li>Navegue até a pasta onde salvou o arquivo: <code className="bg-white border border-gray-200 px-1 rounded">cd C:\Downloads</code></li>
                  <li>Execute: <code className="bg-white border border-gray-200 px-1 rounded">node hivi-print-agent.js --ip 192.168.X.X</code> (substitua pelo IP da impressora)</li>
                  <li>Deixe a janela do Prompt <strong>aberta</strong> durante o funcionamento do restaurante</li>
                  <li>Clique em <strong>&ldquo;Verificar agente&rdquo;</strong> no campo acima para confirmar</li>
                </ol>
                <p className="text-gray-500">💡 Para iniciar automaticamente ao ligar o computador, crie um atalho para o comando na pasta de Inicialização do Windows.</p>
              </div>
            </details>
          )}
        </div>

        {/* Agent URL (network mode) */}
        {printerCfg.type === 'network' && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">IP da impressora de rede</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={printerCfg.agentUrl ?? DEFAULT_AGENT_URL}
                onChange={(e) => updatePrinterCfg({ agentUrl: e.target.value })}
                placeholder="http://localhost:6557"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
              />
              <button
                onClick={handleCheckAgent}
                disabled={agentChecking}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-50 flex-shrink-0"
                style={
                  agentStatus === 'online'  ? { borderColor: '#22c55e', color: '#15803d', background: '#dcfce7' } :
                  agentStatus === 'offline' ? { borderColor: '#ef4444', color: '#b91c1c', background: '#fee2e2' } :
                  { borderColor: 'var(--adm-primary)', color: 'var(--adm-primary)', background: 'color-mix(in srgb, var(--adm-primary) 8%, white)' }
                }
              >
                {agentChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {agentStatus === 'online' ? '✓ Online' : agentStatus === 'offline' ? '✗ Offline' : 'Verificar agente'}
              </button>
            </div>
          </div>
        )}

        {/* Paper width */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Largura do papel</p>
          <div className="flex gap-2">
            {([
              { value: 32, label: '58 mm (32 col)' },
              { value: 48, label: '80 mm (48 col)' },
            ] as { value: number; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updatePrinterCfg({ width: opt.value })}
                className="flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                style={printerCfg.width === opt.value ? {
                  borderColor: 'var(--adm-primary)',
                  color: 'var(--adm-primary)',
                  background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                } : { borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-print toggle */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-medium text-gray-800">Auto-imprimir ao confirmar</p>
            <p className="text-xs text-gray-400 mt-0.5">Imprime automaticamente cada novo pedido confirmado.</p>
          </div>
          <button
            onClick={() => updatePrinterCfg({ autoPrint: !printerCfg.autoPrint })}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none"
            style={{ background: printerCfg.autoPrint ? 'var(--adm-primary)' : '#d1d5db' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: printerCfg.autoPrint ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Cut mode — only for ESC/POS modes */}
        {printerCfg.type !== 'browser' && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Corte do papel</p>
            <div className="flex gap-2">
              {([
                { value: 'partial', label: 'Parcial' },
                { value: 'full',    label: 'Total' },
                { value: 'none',    label: 'Sem corte' },
              ] as { value: import('@/lib/thermal-printer/escpos').CutMode; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updatePrinterCfg({ cutMode: opt.value })}
                  className="flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all"
                  style={(printerCfg.cutMode ?? 'partial') === opt.value ? {
                    borderColor: 'var(--adm-primary)',
                    color: 'var(--adm-primary)',
                    background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                  } : { borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Charset — only for ESC/POS modes */}
        {printerCfg.type !== 'browser' && (
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-2">Codificação de caracteres</p>
            <div className="flex gap-2">
              {([
                { value: 'ascii',  label: 'ASCII (sem acentos)' },
                { value: 'latin1', label: 'Latin-1 (com acentos)' },
              ] as { value: import('@/lib/thermal-printer/escpos').Charset; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updatePrinterCfg({ charset: opt.value })}
                  className="flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all"
                  style={(printerCfg.charset ?? 'ascii') === opt.value ? {
                    borderColor: 'var(--adm-primary)',
                    color: 'var(--adm-primary)',
                    background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                  } : { borderColor: '#e5e7eb', color: '#6b7280', background: 'white' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Latin-1 imprime ã, ç, é corretamente — use se sua impressora suportar codepage WPC1252.
            </p>
          </div>
        )}

        {/* Connect + Test */}
        <div className="flex gap-2 flex-wrap">
          {printerCfg.type !== 'browser' && (
            <button
              onClick={handleConnectPrinter}
              disabled={printerConnecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50"
              style={printerConnected
                ? { borderColor: '#22c55e', color: '#15803d', background: '#dcfce7' }
                : { borderColor: 'var(--adm-primary)', color: 'var(--adm-primary)', background: 'color-mix(in srgb, var(--adm-primary) 8%, white)' }
              }
            >
              {printerConnecting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Printer className="w-4 h-4" />
              }
              {printerConnecting
                ? 'Conectando...'
                : printerConnected ? '✓ Conectada' : 'Conectar impressora'
              }
            </button>
          )}

          {printerConnected && (
            <button
              onClick={handleTestPrint}
              disabled={printerTesting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
              style={printerTestOk ? { background: '#dcfce7', color: '#15803d', borderColor: '#22c55e' } : undefined}
            >
              {printerTesting
                ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                : printerTestOk ? <Check className="w-4 h-4" /> : <Printer className="w-4 h-4 text-gray-400" />
              }
              {printerTesting ? 'Imprimindo...' : printerTestOk ? 'Impresso!' : 'Imprimir teste'}
            </button>
          )}

          {printerConnected && (
            <button
              onClick={handleDisconnectPrinter}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              Remover impressora
            </button>
          )}
        </div>

        {printerError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{printerError}</p>
        )}
      </Section>

      {/* ── Funcionários ── */}
      <Section title="Equipe">
        <p className="text-sm text-gray-500 mb-4">
          {staffCount} {staffCount === 1 ? 'membro na equipe' : 'membros na equipe'}.
          Gerencie quem tem acesso ao painel do restaurante.
        </p>
        <a
          href={`/${restaurant.slug}/adm/funcionarios`}
          className="adm-btn-primary inline-flex items-center gap-2 text-sm"
        >
          Gerenciar equipe
        </a>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SliderField({
  label, value, min, max, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
          >−</button>
          <span className="text-xs font-mono w-8 text-center text-gray-700">{value}</span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
          >+</button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--adm-primary) ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%)`,
          accentColor: 'var(--adm-primary)',
        }}
      />
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
