import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    const { origin } = new URL(request.url)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Busca o stripe_customer_id de qualquer restaurante do usuário
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('stripe_customer_id')
      .eq('owner_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single()

    if (!restaurant?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: restaurant.stripe_customer_id,
      return_url: `${origin}/conta`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch {
    return NextResponse.json({ error: 'Erro ao abrir portal de pagamento' }, { status: 500 })
  }
}
