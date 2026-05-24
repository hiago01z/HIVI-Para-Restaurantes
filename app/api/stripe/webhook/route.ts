import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { queueOnboardingEmails } from '@/lib/resend'

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
      const { user_id, restaurant_name, slug, plan, restaurant_id, currency } = session.metadata!

      // ── Upgrade de restaurante existente (free → basic/pro) ──
      if (restaurant_id) {
        await supabase
          .from('restaurants')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: plan === 'pro' ? 'pro' : 'basic',
          })
          .eq('id', restaurant_id)
          .eq('owner_id', user_id)
        break
      }

      // ── Novo restaurante via checkout pago ──
      const { error } = await supabase.from('restaurants').insert({
        owner_id: user_id,
        name: restaurant_name,
        slug,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        is_active: true,
        plan: plan === 'pro' ? 'pro' : 'basic',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currency: currency === 'EUR' ? 'EUR' : 'BRL',
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

      // Copiar categorias e produtos do restaurante template (se configurado)
      const templateId = process.env.TEMPLATE_RESTAURANT_ID
      if (templateId) {
        const { data: templateCats } = await supabase
          .from('categories')
          .select('id, name, image_url, display_order')
          .eq('restaurant_id', templateId)
          .order('display_order', { ascending: true })

        const catIdMap: Record<string, string> = {}

        if (templateCats && templateCats.length > 0) {
          for (const cat of templateCats) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({
                restaurant_id: newRestaurant.id,
                name: cat.name,
                image_url: cat.image_url,
                display_order: cat.display_order,
              })
              .select('id')
              .single()
            if (newCat) catIdMap[cat.id] = newCat.id
          }

          const { data: templateProds } = await supabase
            .from('products')
            .select('name, description, price, image_url, category_id, is_featured, is_available')
            .eq('restaurant_id', templateId)

          if (templateProds && templateProds.length > 0) {
            await supabase.from('products').insert(
              templateProds.map((p) => ({
                restaurant_id: newRestaurant.id,
                name: p.name,
                description: p.description,
                price: p.price,
                image_url: p.image_url,
                category_id: p.category_id ? (catIdMap[p.category_id] ?? null) : null,
                is_featured: p.is_featured,
                is_available: p.is_available,
              }))
            )
          }
        }

        // Copiar tema do template (cores, fonte)
        const { data: templateTheme } = await supabase
          .from('restaurant_themes')
          .select('primary_color, secondary_color, background_color, font_family, font_size_base')
          .eq('restaurant_id', templateId)
          .single()

        if (templateTheme) {
          await supabase.from('restaurant_themes').update({
            primary_color: templateTheme.primary_color,
            secondary_color: templateTheme.secondary_color,
            background_color: templateTheme.background_color,
            font_family: templateTheme.font_family,
            font_size_base: templateTheme.font_size_base,
          }).eq('restaurant_id', newRestaurant.id)
        }
      }

      // Enfileira sequência de onboarding (boas-vindas, dia 3, dia 6)
      if (session.customer_email && newRestaurant) {
        queueOnboardingEmails(newRestaurant.id, session.customer_email).catch((err) =>
          console.error('Erro ao enfileirar e-mails:', err)
        )
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

      // Se o metadata da subscription contém plan (upgrade via API), persiste
      const planFromMeta = subscription.metadata?.plan
      const updatePayload: Record<string, unknown> = { is_active: isActive }
      if (planFromMeta === 'pro' || planFromMeta === 'basic') {
        updatePayload.plan = planFromMeta
      }

      // Detecta upgrade via price_id (BRL e EUR)
      const priceId = subscription.items.data[0]?.price?.id
      const proPrices = [process.env.STRIPE_PRICE_PRO, process.env.STRIPE_PRICE_PRO_EUR].filter(Boolean)
      const basicPrices = [process.env.STRIPE_PRICE_BASIC, process.env.STRIPE_PRICE_BASIC_EUR].filter(Boolean)
      if (priceId && proPrices.includes(priceId)) {
        updatePayload.plan = 'pro'
      } else if (priceId && basicPrices.includes(priceId)) {
        updatePayload.plan = 'basic'
      }

      await supabase
        .from('restaurants')
        .update(updatePayload)
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
