import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const OWNER_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? ''

export async function POST(request: Request) {
  // ── Auth: apenas o dono da HIVI ───────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { restaurantId, slug, restaurantName, ownerName } = await request.json()
  if (!restaurantId || !slug) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // ── Busca e-mail do dono via service role ─────────────────────────────────
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ru } = await service
    .from('restaurant_users')
    .select('user_id')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!ru) {
    return NextResponse.json({ error: 'Dono não encontrado' }, { status: 404 })
  }

  const { data: authUser } = await service.auth.admin.getUserById(ru.user_id)
  const toEmail = authUser?.user?.email
  if (!toEmail) {
    return NextResponse.json({ error: 'E-mail do usuário não encontrado' }, { status: 404 })
  }

  // ── Envia e-mail ──────────────────────────────────────────────────────────
  const base    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hivi-web.com'
  const menuUrl = `${base}/${slug}`
  const admUrl  = `${base}/${slug}/adm`
  const firstName = (ownerName ?? '').split(' ')[0] || 'você'

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from:     'HIVI <noreply@hivi-web.com>',
    to:       [toEmail],
    replyTo:  'support@hivi-web.com',
    subject:  `Bem-vindo à HIVI, ${firstName}! 🎉`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="${base}" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:900;color:#FF6B00;letter-spacing:-0.5px;text-transform:uppercase;">HIVI</span>
          </a>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">Bem-vindo à HIVI, ${firstName}! 🎉</h1>
          <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">
            O cardápio digital de <strong>${restaurantName}</strong> está no ar. Seus clientes já podem ver o cardápio, fazer pedidos e acompanhar tudo em tempo real — direto pelo celular, sem precisar baixar nenhum app.
          </p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">Seus links:</p>
          <p style="margin:0 0 6px;font-size:14px;color:#374151;">
            📱 <strong>Cardápio público:</strong>
            <a href="${menuUrl}" style="color:#FF6B00;">${menuUrl}</a>
          </p>
          <p style="margin:0 0 6px;font-size:14px;color:#374151;">
            ⚙️ <strong>Painel ADM:</strong>
            <a href="${admUrl}" style="color:#FF6B00;">${admUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">Dicas para começar:</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅&nbsp; Adicione seus pratos com foto e descrição</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅&nbsp; Configure o logo e as cores do seu cardápio</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅&nbsp; Imprima o QR Code e coloque nas mesas</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅&nbsp; Compartilhe o link no WhatsApp e Instagram</p>
          <div style="background:#fff7ed;border-left:3px solid #FF6B00;border-radius:6px;padding:12px 16px;margin:20px 0;font-size:14px;color:#92400e;">
            Você tem <strong>7 dias de trial gratuito</strong> com acesso completo. Qualquer dúvida, é só responder este e-mail.
          </div>
          <a href="${admUrl}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#FF6B00;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Acessar meu painel</a>
        </td></tr>
        <tr><td style="padding:24px 0;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6;">
          HIVI Tecnologia · <a href="${base}" style="color:#9ca3af;">hivi-web.com</a><br>
          Você recebeu este e-mail porque criou um cardápio na HIVI.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
  }

  // ── Loga o envio no histórico de contatos ─────────────────────────────────
  await service.from('adm_contacts').insert({
    restaurant_id: restaurantId,
    type:          'welcome_email',
    content:       `E-mail de boas-vindas enviado para ${toEmail}`,
  })

  return NextResponse.json({ ok: true, to: toEmail })
}
