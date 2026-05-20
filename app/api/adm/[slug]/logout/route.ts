import { NextResponse } from 'next/server'
import { admCookieName } from '@/lib/adm-auth'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cookieName = admCookieName(slug)
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
  }
  const response = NextResponse.json({ ok: true })
  // Limpa o cookie em ambos os paths (path antigo e novo) para garantir logout completo
  response.cookies.set(cookieName, '', { ...cookieOpts, path: '/' })
  response.cookies.set(cookieName, '', { ...cookieOpts, path: `/${slug}/adm` })
  return response
}
