/**
 * POST /api/stripe/downgrade
 * Faz downgrade de Pro → Básico sem proration.
 * O plano muda imediatamente na subscription; a próxima fatura será R$59,99.
 */
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const schema = z.object({
  restaurantId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'restaurantId inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verifica que o usuário é dono e que o restaurante está no plano Pro
    const { data: restaurant } = await service
      .from('restaurants')
      .select('id, name, plan, stripe_subscription_id, currency')
      .eq('id', parsed.data.restaurantId)
      .eq('owner_id', user.id)
      .single()

    const isEur = (restaurant as Record<string, unknown> | null)?.currency === 'EUR'
    const priceId = isEur ? process.env.STRIPE_PRICE_BASIC_EUR : process.env.STRIPE_PRICE_BASIC
    if (!priceId) {
      return NextResponse.json({ error: 'Plano Básico não configurado' }, { status: 500 })
    }

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }
    if (restaurant.plan !== 'pro') {
      return NextResponse.json({ error: 'Já está no plano Básico' }, { status: 400 })
    }
    if (!restaurant.stripe_subscription_id) {
      // Sem assinatura Stripe ativa — atualiza só o banco
      await service.from('restaurants').update({ plan: 'basic' }).eq('id', restaurant.id)
      return NextResponse.json({ downgraded: true })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const sub  = await stripe.subscriptions.retrieve(restaurant.stripe_subscription_id)
    const item = sub.items.data[0]

    // proration_behavior: 'none' → sem créditos nem cobranças intermediárias.
    // O plano muda na subscription agora; a próxima fatura será R$59,99.
    await stripe.subscriptions.update(restaurant.stripe_subscription_id, {
      items: [{ id: item.id, price: priceId }],
      proration_behavior: 'none',
      metadata: { plan: 'basic', restaurant_id: restaurant.id },
    })

    // Atualiza no banco imediatamente
    await service
      .from('restaurants')
      .update({ plan: 'basic' })
      .eq('id', restaurant.id)

    return NextResponse.json({ downgraded: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[downgrade]', msg)
    return NextResponse.json({ error: 'Erro ao processar downgrade. Tente novamente.' }, { status: 500 })
  }
}
