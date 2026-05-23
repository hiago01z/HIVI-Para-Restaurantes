/**
 * GET /api/cron/emails
 *
 * Vercel Cron Job — roda a cada hora.
 * Processa e-mails pendentes na tabela email_queue e envia via Resend.
 *
 * Protegido por CRON_SECRET (Vercel injeta automaticamente o header
 * Authorization: Bearer <secret> nas chamadas do cron).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendWelcomeEmail,
  sendOnboardingD3Email,
  sendTrialEndingEmail,
} from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verifica autorização — Vercel injeta CRON_SECRET no header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Busca e-mails pendentes com send_at <= agora (máx. 50 por execução)
  const { data: pending, error } = await supabase
    .from('email_queue')
    .select(`
      id,
      type,
      to_email,
      restaurant_id,
      restaurants ( name, slug )
    `)
    .is('sent_at', null)
    .lte('send_at', new Date().toISOString())
    .order('send_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[cron/emails] Erro ao buscar fila:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const item of pending) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restaurant = item.restaurants as any
    const name: string = restaurant?.name ?? 'seu restaurante'
    const slug: string = restaurant?.slug ?? ''

    try {
      if (item.type === 'welcome') {
        await sendWelcomeEmail(item.to_email, name, slug)
      } else if (item.type === 'onboarding_d3') {
        await sendOnboardingD3Email(item.to_email, name, slug)
      } else if (item.type === 'trial_ending') {
        await sendTrialEndingEmail(item.to_email, name, slug)
      }

      // Marca como enviado
      await supabase
        .from('email_queue')
        .update({ sent_at: new Date().toISOString(), error: null })
        .eq('id', item.id)

      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron/emails] Falha ao enviar ${item.type} para ${item.to_email}:`, message)

      // Registra o erro mas não bloqueia os próximos
      await supabase
        .from('email_queue')
        .update({ error: message })
        .eq('id', item.id)

      failed++
    }
  }

  console.log(`[cron/emails] Processados: ${sent} enviados, ${failed} com erro`)
  return NextResponse.json({ sent, failed })
}
