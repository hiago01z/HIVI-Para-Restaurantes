// ============================================================
// HIVI — API de Configurações do Restaurante (ADM)
// PATCH → atualizar campos da tabela restaurants
// Autentica via cookie HMAC (hivi_adm_{slug}) + service role key
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getAdmTokenPayload, admCookieName } from '@/lib/adm-auth'
import { z } from 'zod'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authorize(slug: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  if (!token) return null
  return getAdmTokenPayload(slug, token)
}

const patchSchema = z.object({
  name:                    z.string().min(1).max(100).optional(),
  instagram_url:           z.string().nullable().optional(),
  whatsapp_number:         z.string().nullable().optional(),
  whatsapp_notify_enabled: z.boolean().optional(),
  is_active:               z.boolean().optional(),
  delivery_enabled:        z.boolean().optional(),
  delivery_hours:          z.any().optional(),
  logo_url:                z.string().nullable().optional(),
  pix_key:                 z.string().nullable().optional(),
  pix_key_type:            z.enum(['cpf','cnpj','email','phone','evp']).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const admPayload = await authorize(slug)
  if (!admPayload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // PIX restrito ao owner
  const pixFields = ['pix_key', 'pix_key_type'] as const
  const touchingPix = pixFields.some((f) => parsed.data[f] !== undefined)
  if (touchingPix && admPayload.role !== 'owner') {
    return NextResponse.json({ error: 'Apenas o dono pode configurar o PIX.' }, { status: 403 })
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
    .from('restaurants')
    .update(parsed.data)
    .eq('id', restaurant.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
