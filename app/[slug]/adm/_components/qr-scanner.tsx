'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, AlertCircle, ScanLine, ImageIcon } from 'lucide-react'
import jsQR from 'jsqr'

type Props = {
  onDetect: (value: string) => void
}

export function QrScanner({ onDetect }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const rafRef      = useRef<number | null>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const detectedRef = useRef(false)

  const [phase, setPhase] = useState<'permission' | 'scanning' | 'error'>('permission')
  const [errorMsg, setErrorMsg] = useState('')

  const stopStream = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Loop de detecção via canvas + jsQR (funciona em iOS, Android, Chrome, Safari)
  const startScanLoop = useCallback(() => {
    function tick() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || detectedRef.current) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) {
            detectedRef.current = true
            stopStream()
            onDetect(code.data)
            return
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onDetect, stopStream])

  useEffect(() => {
    detectedRef.current = false

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        streamRef.current = stream

        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          // iOS precisa de evento onloadedmetadata para dar play
          await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => resolve()
          })
          await video.play()
        }

        setPhase('scanning')
        startScanLoop()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
          setErrorMsg('Permissão de câmera negada. Libere o acesso nas configurações do navegador.')
        } else {
          setErrorMsg('Não foi possível acessar a câmera. Use o botão abaixo para enviar uma foto.')
        }
        setPhase('error')
      }
    }

    init()

    return () => {
      stopStream()
    }
  }, [startScanLoop, stopStream])

  // Fallback: usuário envia foto do QR code (funciona em qualquer iOS/Android)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        if (code?.data) {
          onDetect(code.data)
        } else {
          setErrorMsg('QR code não encontrado na imagem. Tente com mais luz ou mais perto.')
          setPhase('error')
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const FallbackButton = () => (
    <div className="mt-5 text-center">
      <p className="text-xs text-gray-400 mb-3">Ou tire uma foto do QR code:</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-all mx-auto"
      >
        <ImageIcon className="w-4 h-4" />
        Enviar foto do QR code
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )

  if (phase === 'error') {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <p className="font-semibold text-gray-700 mb-1">Câmera indisponível</p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">{errorMsg}</p>
        <FallbackButton />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Vídeo visível / Canvas oculto (só para leitura de pixels) */}
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-gray-900 shadow-lg">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {phase !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80">
            <Camera className="w-10 h-10 text-white animate-pulse" />
            <p className="text-white text-sm font-medium">Iniciando câmera...</p>
          </div>
        )}

        {phase === 'scanning' && (
          <>
            {/* Guia de mira */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
            {/* Linha animada */}
            <div
              className="absolute inset-x-8 pointer-events-none"
              style={{ animation: 'qr-scanline 2s ease-in-out infinite' }}
            >
              <ScanLine className="w-full h-1 opacity-80" style={{ color: 'var(--adm-primary)' }} />
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-400 text-center leading-relaxed">
        Aponte para o QR code do cliente.<br />
        O pedido será confirmado automaticamente.
      </p>

      {/* Fallback sempre visível como alternativa */}
      <FallbackButton />

      <style>{`
        @keyframes qr-scanline {
          0%   { top: 20%; opacity: 0.4; }
          50%  { opacity: 1; }
          100% { top: 80%; opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
