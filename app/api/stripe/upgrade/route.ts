/**
 * POST /api/stripe/upgrade
 * Cria uma sessão de checkout para upgrade de Basic → Pro
 * para um restaurante já existente.
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

    // Verifica que o usuário é dono do restaurante
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: restaurant } = await service
      .from('restaurants')
      .select('id, name, slug, plan, stripe_customer_id, stripe_subscription_id, currency')
      .eq('id', parsed.data.restaurantId)
      .eq('owner_id', user.id)
      .single()

    const isEur = (restaurant as Record<string, unknown> | null)?.currency === 'EUR'
    const priceId = isEur ? process.env.STRIPE_PRICE_PRO_EUR : process.env.STRIPE_PRICE_PRO
    if (!priceId) {
      return NextResponse.json({ error: 'Plano Pro não configurado' }, { status: 500 })
    }

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    if (restaurant.plan === 'pro') {
      return NextResponse.json({ error: 'Já está no plano Pro' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

    // Se já tem assinatura ativa, faz upgrade via Stripe (troca de price na subscription)
    if (restaurant.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(restaurant.stripe_subscription_id)
      const item = sub.items.data[0]

      // proration_behavior: 'none' → plano muda imediatamente, mas sem
      // cobranças/créditos intermediários — a próxima fatura será apenas R$99,99.
      await stripe.subscriptions.update(restaurant.stripe_subscription_id, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: 'none',
        metadata: { plan: 'pro', restaurant_id: restaurant.id },
      })

      // Atualiza o plano no banco imediatamente
      await service
        .from('restaurants')
        .update({ plan: 'pro' })
        .eq('id', restaurant.id)

      return NextResponse.json({ upgraded: true })
    }

    // Sem assinatura: cria novo checkout Pro
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/conta?success=1`,
      cancel_url:  `${appUrl}/conta`,
      customer_email: user.email ?? undefined,
      ...(restaurant.stripe_customer_id
        ? { customer: restaurant.stripe_customer_id }
        : {}),
      metadata: {
        user_id:         user.id,
        restaurant_name: restaurant.name,
        slug:            restaurant.slug,
        plan:            'pro',
        upgrade_for:     restaurant.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upgrade]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
