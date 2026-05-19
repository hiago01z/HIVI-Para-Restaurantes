'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, AlertCircle, ScanLine } from 'lucide-react'

type Props = {
  onDetect: (value: string) => void
}

export function QrScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [phase, setPhase] = useState<'checking' | 'unsupported' | 'permission' | 'scanning' | 'error'>('checking')
  const [errorMsg, setErrorMsg] = useState('')

  const stopStream = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startScanLoop = useCallback((detector: unknown) => {
    let active = true

    async function tick() {
      if (!active || !videoRef.current) return
      try {
        // @ts-expect-error BarcodeDetector not yet in TS lib.dom
        const codes: { rawValue: string }[] = await detector.detect(videoRef.current)
        if (codes.length > 0 && codes[0].rawValue) {
          stopStream()
          onDetect(codes[0].rawValue)
          return
        }
      } catch { /* frame not ready yet */ }
      if (active) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { active = false }
  }, [onDetect, stopStream])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function init() {
      if (!('BarcodeDetector' in window)) {
        setPhase('unsupported')
        return
      }

      try {
        // @ts-expect-error BarcodeDetector not yet in TS lib.dom
        const supported: string[] = await BarcodeDetector.getSupportedFormats()
        if (!supported.includes('qr_code')) {
          setPhase('unsupported')
          return
        }
      } catch {
        setPhase('unsupported')
        return
      }

      setPhase('permission')

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // @ts-expect-error BarcodeDetector not yet in TS lib.dom
        const detector = new BarcodeDetector({ formats: ['qr_code'] })
        setPhase('scanning')
        cleanup = startScanLoop(detector)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setErrorMsg('Permissão de câmera negada. Verifique as configurações do navegador.')
        } else {
          setErrorMsg('Não foi possível acessar a câmera.')
        }
        setPhase('error')
      }
    }

    init()

    return () => {
      stopStream()
      cleanup?.()
    }
  }, [startScanLoop, stopStream])

  if (phase === 'unsupported') {
    return (
      <div className="text-center py-14 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-100">
          <AlertCircle className="w-7 h-7 text-gray-400" />
        </div>
        <p className="font-semibold text-gray-700 mb-2">Scanner não disponível neste dispositivo</p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
          Use o app de câmera do celular para escanear o QR code do cliente.
          O link abrirá a tela de confirmação automaticamente.
        </p>
        <div className="mt-6 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-400 text-left leading-relaxed max-w-xs mx-auto">
          <strong className="block text-gray-500 mb-1">Navegadores compatíveis:</strong>
          Chrome 88+, Edge 88+, Samsung Browser, Safari 17+ (iOS)
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="text-center py-14 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <p className="font-semibold text-gray-700 mb-2">Erro ao acessar câmera</p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">{errorMsg}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-gray-900 shadow-lg">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {phase !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80">
            <Camera className="w-10 h-10 text-white animate-pulse" />
            <p className="text-white text-sm font-medium">Iniciando câmera...</p>
          </div>
        )}

        {phase === 'scanning' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
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
