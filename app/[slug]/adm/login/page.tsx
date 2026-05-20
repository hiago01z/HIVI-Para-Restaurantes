import { Suspense } from 'react'
import { LoginForm } from './_login-form'

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default async function AdmLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm slug={slug} />
    </Suspense>
  )
}
