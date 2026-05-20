import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const notifySchema = z.object({
  phone: z.string().min(10),
  message: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // Guarda de segurança: apenas chamadas internas são permitidas
    // O header X-Internal-Secret é enviado pela rota de status de pedidos
    const internalSecret = request.headers.get('x-internal-secret')
    const expectedSecret = process.env.INTERNAL_API_SECRET
    if (expectedSecret && internalSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limit: 20 mensagens por IP por hora (protege contra spam externo sem o secret)
    const ip = getClientIp(request)
    if (!rateLimit(`whatsapp:${ip}`, 20, 60 * 60_000)) {
      return NextResponse.json({ error: 'Limite de mensagens atingido.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = notifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { phone, message } = parsed.data

    const response = await fetch(
      `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: process.env.ULTRAMSG_TOKEN!,
          to: phone,
          body: message,
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao enviar WhatsApp' }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
