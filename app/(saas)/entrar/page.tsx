import { SaasFooter } from '@/components/saas/saas-footer'
import Link from 'next/link'

export default function EntrarPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header simples */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="text-3xl font-black tracking-tight text-gray-900">
          HIVI
        </Link>
        <Link href="/criar-conta" className="text-base font-medium text-orange-500 hover:text-orange-600 transition-colors">
          Criar conta
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <main className="flex-1 flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Entrar na HIVI
            </h1>
            <p className="text-base text-gray-500">
              Acesse sua conta para gerenciar seus restaurantes.
            </p>
          </div>

          {/* Botão Google */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-4 w-full py-4 border-2 border-gray-200 rounded-2xl text-base font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </a>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Ao entrar, você concorda com os{' '}
              <Link href="/termos" className="text-orange-500 hover:underline">Termos de uso</Link>
              {' '}e a{' '}
              <Link href="/privacidade" className="text-orange-500 hover:underline">Política de privacidade</Link>.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-base text-gray-600">
              Ainda não tem conta?{' '}
              <Link href="/criar-conta" className="text-orange-500 font-bold hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SaasFooter />
    </div>
  )
}
