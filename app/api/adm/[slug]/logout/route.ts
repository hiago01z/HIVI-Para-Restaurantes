import { NextResponse } from 'next/server'
import { admCookieName } from '@/lib/adm-auth'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const response = NextResponse.json({ ok: true })
  response.cookies.set(admCookieName(slug), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
