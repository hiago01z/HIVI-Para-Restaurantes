// ============================================================
// HIVI — API de Tema do Restaurante (ADM)
// PATCH → upsert na tabela restaurant_themes
// Autentica via cookie HMAC (hivi_adm_{slug}) + service role key
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'
import { z } from 'zod'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authorize(slug: string): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  if (!token) return false
  return verifyAdmToken(slug, token)
}

const themeSchema = z.object({
  primary_color:          z.string().optional(),
  secondary_color:        z.string().optional(),
  background_color:       z.string().optional(),
  font_family:            z.string().optional(),
  font_size_base:         z.string().optional(),
  banner_url:             z.string().nullable().optional(),
  text_color:             z.string().optional(),
  icon_color:             z.string().optional(),
  label_font:             z.string().optional(),
  label_color:            z.string().optional(),
  label_effect:           z.string().optional(),
  label_stroke_color:     z.string().optional(),
  label_stroke_size:      z.number().optional(),
  label_offset_distance:  z.number().optional(),
  label_offset_angle:     z.number().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!(await authorize(slug))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = themeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('restaurant_themes')
    .upsert(
      { restaurant_id: restaurant.id, ...parsed.data },
      { onConflict: 'restaurant_id' }
    )

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar tema' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
