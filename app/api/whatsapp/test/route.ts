import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'
import { z } from 'zod'

const schema = z.object({
  slug: z.string().min(1),
  restaurantId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { slug, restaurantId } = parsed.data

    // Verifica autenticação ADM
    const cookieStore = await cookies()
    const token = cookieStore.get(admCookieName(slug))?.value
    const validAdm = token ? await verifyAdmToken(slug, token) : false
    if (!validAdm) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica variáveis de ambiente
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID
    const apiToken = process.env.ULTRAMSG_TOKEN
    if (!instanceId || !apiToken) {
      return NextResponse.json(
        { error: 'Credenciais UltraMsg não configuradas no servidor (ULTRAMSG_INSTANCE_ID / ULTRAMSG_TOKEN).' },
        { status: 500 }
      )
    }

    // Busca o número de WhatsApp do restaurante
    const supabase = await createClient()
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, whatsapp_number')
      .eq('id', restaurantId)
      .single()

    if (!restaurant?.whatsapp_number) {
      return NextResponse.json(
        { error: 'Número de WhatsApp não configurado. Salve o número antes de testar.' },
        { status: 400 }
      )
    }

    const message =
      `🧪 *Teste HIVI*\n\n` +
      `✅ As notificações estão configuradas!\n\n` +
      `Você receberá mensagens assim quando chegar um novo pedido de entrega para *${restaurant.name}*.\n\n` +
      `_Mensagem de teste enviada pelo painel HIVI._`

    // Chama o UltraMsg diretamente para capturar o erro exato
    const umRes = await fetch(
      `https://api.ultramsg.com/${instanceId}/messages/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: apiToken,
          to: restaurant.whatsapp_number,
          body: message,
        }),
      }
    )

    const umData = await umRes.json().catch(() => ({}))

    if (!umRes.ok || umData?.error) {
      const detail = umData?.error ?? umData?.message ?? `HTTP ${umRes.status}`
      return NextResponse.json(
        { error: `UltraMsg: ${detail}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Erro interno: ${message}` }, { status: 500 })
  }
}

