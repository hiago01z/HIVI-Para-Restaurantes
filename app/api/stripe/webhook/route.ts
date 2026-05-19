import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendRestaurantCreatedEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { user_id, restaurant_name, slug } = session.metadata!

      const { error } = await supabase.from('restaurants').insert({
        owner_id: user_id,
        name: restaurant_name,
        slug,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        is_active: true,
      })

      if (error) {
        console.error('Erro ao criar restaurante:', error)
        break
      }

      // Buscar o ID do restaurante recém-criado
      const { data: newRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!newRestaurant) break

      // Adicionar dono em restaurant_users (role=owner) para acesso ao ADM
      await supabase.from('restaurant_users').insert({
        restaurant_id: newRestaurant.id,
        user_id,
        role: 'owner',
      })

      // Criar tema padrão
      await supabase.from('restaurant_themes').insert({
        restaurant_id: newRestaurant.id,
      })

      // Envia e-mail de boas-vindas via Resend
      if (session.customer_email) {
        try {
          await sendRestaurantCreatedEmail(session.customer_email, restaurant_name, slug)
        } catch (emailErr) {
          console.error('Erro ao enviar e-mail:', emailErr)
          // Não falha o webhook por causa do e-mail
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('restaurants')
        .update({ is_active: false })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const isActive = subscription.status === 'active'
      await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
