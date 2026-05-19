import { NextResponse } from 'next/server'
import { z } from 'zod'

const notifySchema = z.object({
  phone: z.string().min(10),
  message: z.string().min(1),
})

export async function POST(request: Request) {
  try {
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
