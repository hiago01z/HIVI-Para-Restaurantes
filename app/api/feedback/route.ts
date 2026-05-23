import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  name: z.string().max(100).optional().default('Anônimo'),
  email: z.string().email().max(200),
  type: z.enum(['sugestao', 'bug', 'elogio', 'outro']),
  message: z.string().min(10).max(2000),
})

const TYPE_LABELS: Record<string, string> = {
  sugestao: 'Sugestão de melhoria',
  bug: 'Reportar um problema',
  elogio: 'Elogio',
  outro: 'Outro',
}

export async function POST(request: Request) {
  // Rate limit: 3 feedbacks por IP por hora
  const ip = getClientIp(request)
  if (!rateLimit(`feedback:${ip}`, 3, 60 * 60_000)) {
    return NextResponse.json(
      { error: 'Muitas mensagens. Aguarde um momento e tente novamente.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { name, email, type, message } = parsed.data
    const to = process.env.FEEDBACK_TO_EMAIL ?? 'hiagoalmeida852@gmail.com'
    const from = 'noreply@hivi-web.com'

    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[HIVI Feedback] ${TYPE_LABELS[type]} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#f97316;margin-bottom:4px">Novo feedback recebido</h2>
          <p style="color:#6b7280;margin-top:0;margin-bottom:24px;font-size:13px">via hivi-web.com</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;font-weight:bold;width:120px;border:1px solid #e5e7eb">Nome</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;font-weight:bold;border:1px solid #e5e7eb">E-mail</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;font-weight:bold;border:1px solid #e5e7eb">Tipo</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb">${TYPE_LABELS[type]}</td>
            </tr>
          </table>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px">
            <p style="margin:0;white-space:pre-wrap;color:#111827">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>

          <p style="margin-top:24px;font-size:12px;color:#9ca3af">
            Para responder, use Reply-To: ${email}
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: 'Falha ao enviar. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
