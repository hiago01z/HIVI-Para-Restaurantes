'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Upload, Move } from 'lucide-react'

export type ImageCropPickerHandle = {
  hasNewImage: () => boolean
  getCroppedFile: () => Promise<File | null>
}

type Props = {
  initialUrl?: string | null
  sizeHint?: string
}

const OUTPUT_SIZE = 800

export const ImageCropPicker = forwardRef<ImageCropPickerHandle, Props>(
  function ImageCropPicker(
    { initialUrl, sizeHint = 'Recomendado: 800 × 800 px (quadrado)' },
    ref,
  ) {
    // Blob URL from user-selected file
    const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null)
    // Blob URL pre-fetched from initialUrl (enables drag + canvas crop for existing images)
    const [initialBlobUrl, setInitialBlobUrl] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [imgPos, setImgPos] = useState({ x: 0, y: 0 })
    const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const dragRef = useRef({ mx: 0, my: 0, px: 0, py: 0, moved: false })
    const hasMoved = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Pre-fetch initialUrl as a local blob so drag and canvas crop work for existing images
    useEffect(() => {
      if (!initialUrl) return
      let cancelled = false
      let created: string | null = null
      fetch(initialUrl)
        .then((r) => r.blob())
        .then((blob) => {
          if (cancelled) return
          created = URL.createObjectURL(blob)
          setInitialBlobUrl(created)
        })
        .catch(() => { /* image still displays via initialUrl fallback */ })
      return () => {
        cancelled = true
        if (created) URL.revokeObjectURL(created)
      }
    }, [initialUrl])

    // Revoke file blob URL when replaced or on unmount
    useEffect(() => {
      return () => { if (fileBlobUrl) URL.revokeObjectURL(fileBlobUrl) }
    }, [fileBlobUrl])

    // Active blob URL: file selection takes priority over initialUrl blob
    const activeBlobUrl = fileBlobUrl ?? initialBlobUrl

    function getScaling() {
      if (!imgNatural || !containerRef.current) return null
      const cs = containerRef.current.offsetWidth
      if (!cs) return null
      const { w, h } = imgNatural
      const scale = Math.max(cs / w, cs / h)
      const sw = w * scale
      const sh = h * scale
      return {
        cs,
        sw,
        sh,
        maxX: Math.max(0, (sw - cs) / 2),
        maxY: Math.max(0, (sh - cs) / 2),
      }
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
      if (!activeBlobUrl || !imgNatural) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = { mx: e.clientX, my: e.clientY, px: imgPos.x, py: imgPos.y, moved: false }
      setIsDragging(true)
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (!isDragging) return
      const s = getScaling()
      if (!s) return
      const dx = e.clientX - dragRef.current.mx
      const dy = e.clientY - dragRef.current.my
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragRef.current.moved = true
        hasMoved.current = true
      }
      setImgPos({
        x: Math.max(-s.maxX, Math.min(s.maxX, dragRef.current.px + dx)),
        y: Math.max(-s.maxY, Math.min(s.maxY, dragRef.current.py + dy)),
      })
    }

    function handlePointerUp() {
      setIsDragging(false)
    }

    function handleContainerClick() {
      if (dragRef.current.moved) { dragRef.current.moved = false; return }
      if (!displayUrl) fileInputRef.current?.click()
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setPendingFile(file)
      setFileBlobUrl(url)
      setImgPos({ x: 0, y: 0 })
      setImgNatural(null)
      hasMoved.current = false
      e.target.value = ''
    }

    useImperativeHandle(ref, () => ({
      // True if a new file was selected OR the user repositioned the existing image
      hasNewImage: () => pendingFile !== null || hasMoved.current,
      getCroppedFile: async () => {
        if (!activeBlobUrl || !imgNatural || !containerRef.current) return null
        const cs = containerRef.current.offsetWidth
        if (!cs) return null
        return cropToSquare(activeBlobUrl, imgPos, imgNatural, cs)
      },
    }))

    // While initialBlobUrl is loading, fall back to the remote URL so the image shows immediately
    const displayUrl = activeBlobUrl ?? initialUrl ?? null
    const s = getScaling()
    // Drag is available once the blob is ready and the image has room to pan
    const canDrag = !!activeBlobUrl && !!s && (s.maxX > 0.5 || s.maxY > 0.5)

    return (
      <div>
        <div
          ref={containerRef}
          className="adm-upload-area aspect-square select-none"
          style={{ cursor: isDragging ? 'grabbing' : canDrag ? 'grab' : 'pointer' }}
          onClick={handleContainerClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {displayUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="preview"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget
                  setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
                }}
                style={
                  s
                    ? {
                        // Explicit pixel layout — fills container and responds to drag
                        position: 'absolute',
                        width: `${s.sw}px`,
                        height: `${s.sh}px`,
                        left: `${(s.cs - s.sw) / 2 + imgPos.x}px`,
                        top: `${(s.cs - s.sh) / 2 + imgPos.y}px`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }
                    : {
                        // Fallback while natural dimensions are not yet known
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover' as const,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }
                }
              />

              {/* Drag hint overlay — visible on hover when draggable */}
              {canDrag && !isDragging && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.4)' }}
                >
                  <Move className="w-5 h-5 text-white" />
                  <span className="text-white text-xs font-medium">Arraste para ajustar</span>
                </div>
              )}

              {/* Change image button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-semibold text-white rounded-lg"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              >
                Trocar
              </button>
            </>
          ) : (
            <div className="text-center pointer-events-none">
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
              <p className="text-sm text-gray-400">Clique para enviar</p>
            </div>
          )}
        </div>

        {sizeHint && (
          <p className="text-xs text-gray-400 mt-1.5 text-center">{sizeHint}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  },
)

async function cropToSquare(
  blobUrl: string,   // local blob URL — no CORS issues for canvas
  pos: { x: number; y: number },
  natural: { w: number; h: number },
  containerSize: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT_SIZE
        canvas.height = OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas indisponível')

        const { w, h } = natural
        const scale = Math.max(containerSize / w, containerSize / h)
        const sw = w * scale
        const sh = h * scale

        // pos.x > 0 → image shifted right → visible region is LEFT portion → srcX decreases
        const srcX = Math.max(0, ((sw - containerSize) / 2 - pos.x) / scale)
        const srcY = Math.max(0, ((sh - containerSize) / 2 - pos.y) / scale)
        const srcW = Math.min(containerSize / scale, w - srcX)
        const srcH = Math.min(containerSize / scale, h - srcY)

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Falha ao processar imagem')); return }
            resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.92,
        )
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = blobUrl
  })
}
