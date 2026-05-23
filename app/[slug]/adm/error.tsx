'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdmError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ADM Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Ocorreu um erro</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Algo deu errado ao carregar esta página. Tente novamente ou recarregue.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
        style={{ background: 'var(--adm-primary, #FF6B00)' }}
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </button>
      {error.digest && (
        <p className="text-xs text-gray-400 mt-4">Código: {error.digest}</p>
      )}
    </div>
  )
}
