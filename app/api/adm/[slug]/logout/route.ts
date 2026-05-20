import { NextResponse } from 'next/server'
import { admCookieName } from '@/lib/adm-auth'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cookieName = admCookieName(slug)
  const secure = process.env.NODE_ENV === 'production'
  const secureFlag = secure ? '; Secure' : ''

  const response = NextResponse.json({ ok: true })

  // Usar headers.append para limpar o cookie nos dois paths sem sobrescrever
  response.headers.append(
    'Set-Cookie',
    `${cookieName}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`
  )
  response.headers.append(
    'Set-Cookie',
    `${cookieName}=; Path=/${slug}/adm; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`
  )
  return response
}
