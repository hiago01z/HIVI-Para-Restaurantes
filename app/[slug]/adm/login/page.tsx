import { Suspense } from 'react'
import { LoginForm } from './_login-form'

export default async function AdmLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense>
      <LoginForm slug={slug} />
    </Suspense>
  )
}
