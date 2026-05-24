import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const schema = z.object({
  restaurantId: z.string().uuid(),
  plan: z.enum(['basic', 'pro']),
})

// POST /api/stripe/subscribe — Assinar plano pago para restaurante já existente (free → basic/pro)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const { restaurantId, plan } = parsed.data

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verifica que o restaurante pertence ao usuário e está no plano free
    const { data: restaurant } = await serviceClient
      .from('restaurants')
      .select('id, name, slug, plan, stripe_customer_id, currency')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }
    if (restaurant.plan !== 'free') {
      return NextResponse.json({ error: 'Este restaurante já possui uma assinatura.' }, { status: 400 })
    }

    const isEur = (restaurant as Record<string, unknown>).currency === 'EUR'
    const priceId = plan === 'pro'
      ? (isEur ? process.env.STRIPE_PRICE_PRO_EUR : process.env.STRIPE_PRICE_PRO)
      : (isEur ? process.env.STRIPE_PRICE_BASIC_EUR : process.env.STRIPE_PRICE_BASIC)
    if (!priceId) {
      return NextResponse.json({ error: `Plano ${plan} não configurado` }, { status: 500 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/conta?success=1`,
      cancel_url: `${appUrl}/conta?cancelled=1`,
      // Se já tem customer Stripe, reutiliza; caso contrário usa e-mail
      ...(restaurant.stripe_customer_id
        ? { customer: restaurant.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      metadata: {
        user_id: user.id,
        restaurant_id: restaurantId, // restaurante existente — webhook vai fazer UPDATE, não INSERT
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscribe] error:', msg)
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 })
  }
}
