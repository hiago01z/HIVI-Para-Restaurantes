import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Identidades de e-mail da HIVI
 *
 * noreply  → disparos automáticos (onboarding, avisos de trial)
 *            Não tem inbox — respostas caem no support via reply_to
 * support  → atendimento ao cliente — ImprovMX → hiagoalmeida852@gmail.com
 * feedback → canal de feedback — ImprovMX → hiagoalmeida852@gmail.com
 */
const FROM_NOREPLY  = process.env.RESEND_FROM_NOREPLY  ?? 'noreply@hivi-web.com'
const FROM_SUPPORT  = process.env.RESEND_FROM_SUPPORT  ?? 'support@hivi-web.com'
export const FROM_FEEDBACK = process.env.RESEND_FROM_FEEDBACK ?? 'feedback@hivi-web.com'

/** Reply-to padrão: respostas a e-mails automáticos chegam no suporte */
const REPLY_TO = FROM_SUPPORT

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hivi-web.com'

// ─── Helpers de layout ────────────────────────────────────────────────────────

function emailWrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HIVI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="${APP_URL}" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:900;color:#FF6B00;letter-spacing:-0.5px;text-transform:uppercase;">HIVI</span>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6;">
          HIVI Tecnologia · <a href="${APP_URL}" style="color:#9ca3af;">hivi-web.com</a><br>
          Você recebeu este e-mail porque criou um cardápio na HIVI.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#FF6B00;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">${label}</a>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">${text}</p>`
}

function hr(): string {
  return `<hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">`
}

function checkItem(text: string): string {
  return `<p style="margin:0 0 10px;font-size:14px;color:#374151;">✅&nbsp; ${text}</p>`
}

function tip(text: string): string {
  return `<div style="background:#fff7ed;border-left:3px solid #FF6B00;border-radius:6px;padding:12px 16px;margin:20px 0;font-size:14px;color:#92400e;">${text}</div>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * E-mail 1 — Boas-vindas (enviado imediatamente ao criar o cardápio)
 */
function buildWelcomeHtml(restaurantName: string, slug: string): string {
  const admUrl = `${APP_URL}/${slug}/adm`
  const menuUrl = `${APP_URL}/${slug}`

  return emailWrap(`
    ${h1(`${restaurantName} está no ar! 🎉`)}
    ${p('Seu cardápio digital foi criado com sucesso. Você tem <strong>7 dias de acesso completo ao plano Pro</strong> — use sem moderação.')}
    ${hr()}
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">Seus links:</p>
    <p style="margin:0 0 6px;font-size:14px;color:#374151;">
      📱 <strong>Cardápio público:</strong>
      <a href="${menuUrl}" style="color:#FF6B00;">${menuUrl}</a>
    </p>
    <p style="margin:0 0 6px;font-size:14px;color:#374151;">
      ⚙️ <strong>Painel ADM:</strong>
      <a href="${admUrl}" style="color:#FF6B00;">${admUrl}</a>
    </p>
    ${hr()}
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">Por onde começar:</p>
    ${checkItem('Acesse o painel e configure a senha do ADM')}
    ${checkItem('Crie pelo menos uma categoria (ex: Lanches, Bebidas)')}
    ${checkItem('Adicione seus pratos com foto e preço')}
    ${checkItem('Personalize as cores do cardápio em Configurações')}
    ${checkItem('Baixe o QR code e coloque nas mesas')}
    ${btn('Acessar meu painel →', admUrl)}
    ${tip('💡 <strong>Dica:</strong> Imprima o QR code, coloque na mesa e mostre para um cliente de confiança testar. O feedback inicial é ouro.')}
  `)
}

/**
 * E-mail 2 — Dia 3: checklist de setup (enviado 3 dias após criação)
 */
function buildOnboardingD3Html(restaurantName: string, slug: string): string {
  const admUrl = `${APP_URL}/${slug}/adm`

  return emailWrap(`
    ${h1('Seu cardápio está configurado? ✅')}
    ${p(`Olá! Passaram 3 dias desde que você criou o <strong>${restaurantName}</strong> na HIVI. Você ainda tem <strong>4 dias de trial Pro</strong>.`)}
    ${p('Cardápios com foto e preços preenchidos recebem até 3× mais pedidos do que os que ficam vazios. Veja o que já deve estar pronto:')}
    ${hr()}
    ${checkItem('Pelo menos <strong>1 categoria</strong> criada')}
    ${checkItem('Pelo menos <strong>3 pratos</strong> com foto e preço')}
    ${checkItem('Logo ou banner do restaurante configurado')}
    ${checkItem('QR code impresso e colocado na mesa (ou link compartilhado)')}
    ${checkItem('<strong>Impressora térmica</strong> configurada em Configurações → Impressora')}
    ${hr()}
    ${p('Faltou alguma coisa? Acesse o painel agora e deixa tudo no lugar antes do trial acabar.')}
    ${btn('Continuar configurando →', admUrl)}
    ${tip('💡 <strong>Dica Pro:</strong> Ative o WhatsApp automático em Configurações → Redes Sociais. Seus clientes de entrega vão receber atualização do pedido automaticamente.')}
  `)
}

/**
 * E-mail 3 — Dia 6: trial termina amanhã (enviado 6 dias após criação)
 */
function buildTrialEndingHtml(restaurantName: string, slug: string): string {
  const contaUrl = `${APP_URL}/conta`
  const admUrl = `${APP_URL}/${slug}/adm`

  return emailWrap(`
    ${h1('Seu trial termina amanhã ⏰')}
    ${p(`O trial de 7 dias do <strong>${restaurantName}</strong> vence amanhã. Depois disso, o cardápio passa para o <strong>plano Gratuito</strong> com algumas limitações:`)}
    <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">❌ Limite de 16 pratos e 4 categorias</p>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">❌ Sem WhatsApp automático para entregas</p>
      <p style="margin:0 0 0;font-size:14px;color:#6b7280;">❌ Sem analytics e relatórios</p>
    </div>
    ${p('Para manter tudo funcionando sem limitações, assine o <strong>Plano Básico por R$59,99/mês</strong>.')}
    ${btn('Assinar agora — R$59,99/mês →', contaUrl)}
    ${hr()}
    ${p('Prefere continuar de graça? Tudo bem — seu cardápio continua ativo, apenas com os limites do plano gratuito. Nada é deletado.')}
    <p style="margin:0;font-size:14px;color:#6b7280;">
      Dúvidas? Responda este e-mail ou acesse
      <a href="${admUrl}" style="color:#FF6B00;">o painel</a>.
    </p>
  `)
}

// ─── Funções de envio ─────────────────────────────────────────────────────────

/**
 * Headers padrão para e-mails transacionais em volume.
 * List-Unsubscribe é exigido pelo Gmail para remetentes de alto volume
 * e melhora significativamente a reputação de entrega.
 */
function transactionalHeaders(to: string): Record<string, string> {
  const encoded = encodeURIComponent(to)
  const unsubUrl = `${APP_URL}/unsubscribe?email=${encoded}`
  return {
    'List-Unsubscribe': `<mailto:${FROM_SUPPORT}?subject=unsubscribe>, <${unsubUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Entity-Ref-ID': `hivi-onboarding-${Date.now()}`,
  }
}

export async function sendWelcomeEmail(
  to: string,
  restaurantName: string,
  slug: string,
) {
  return resend.emails.send({
    from: `HIVI <${FROM_NOREPLY}>`,
    reply_to: REPLY_TO,
    to,
    subject: `${restaurantName} está no ar! 🎉 Veja seus primeiros passos`,
    html: buildWelcomeHtml(restaurantName, slug),
    headers: transactionalHeaders(to),
  })
}

export async function sendOnboardingD3Email(
  to: string,
  restaurantName: string,
  slug: string,
) {
  return resend.emails.send({
    from: `HIVI <${FROM_NOREPLY}>`,
    reply_to: REPLY_TO,
    to,
    subject: `${restaurantName} — seu cardápio está configurado? ✅`,
    html: buildOnboardingD3Html(restaurantName, slug),
    headers: transactionalHeaders(to),
  })
}

export async function sendTrialEndingEmail(
  to: string,
  restaurantName: string,
  slug: string,
) {
  return resend.emails.send({
    from: `HIVI <${FROM_NOREPLY}>`,
    reply_to: REPLY_TO,
    to,
    subject: `Seu trial termina amanhã — o que acontece com ${restaurantName}?`,
    html: buildTrialEndingHtml(restaurantName, slug),
    headers: transactionalHeaders(to),
  })
}

/**
 * Envia um e-mail a partir do suporte (support@hivi-web.com).
 * Use para respostas manuais, notificações de conta, etc.
 */
export async function sendSupportEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: `HIVI Suporte <${FROM_SUPPORT}>`,
    reply_to: FROM_SUPPORT,
    to,
    subject,
    html,
  })
}

/**
 * Envia um e-mail a partir do canal de feedback (feedback@hivi-web.com).
 * Use para pesquisas de satisfação, NPS, etc.
 */
export async function sendFeedbackEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: `HIVI Feedback <${FROM_FEEDBACK}>`,
    reply_to: FROM_FEEDBACK,
    to,
    subject,
    html,
  })
}

// ─── Fila de onboarding ───────────────────────────────────────────────────────

/**
 * Enfileira os 3 e-mails de onboarding para um restaurante recém-criado.
 * Chamada no momento de criação (free route e stripe webhook).
 */
export async function queueOnboardingEmails(
  restaurantId: string,
  toEmail: string,
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  await supabase.from('email_queue').insert([
    {
      restaurant_id: restaurantId,
      to_email: toEmail,
      type: 'welcome',
      send_at: new Date(now).toISOString(),             // imediato
    },
    {
      restaurant_id: restaurantId,
      to_email: toEmail,
      type: 'onboarding_d3',
      send_at: new Date(now + 3 * DAY).toISOString(),   // dia 3
    },
    {
      restaurant_id: restaurantId,
      to_email: toEmail,
      type: 'trial_ending',
      send_at: new Date(now + 6 * DAY).toISOString(),   // dia 6
    },
  ])
}

/** Compatibilidade — mantém chamadas antigas funcionando */
export async function sendRestaurantCreatedEmail(
  to: string,
  restaurantName: string,
  slug: string,
) {
  return sendWelcomeEmail(to, restaurantName, slug)
}
