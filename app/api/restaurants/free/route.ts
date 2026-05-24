import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { queueOnboardingEmails } from '@/lib/resend'
import { createAdmToken, admCookieName, COOKIE_MAX_AGE } from '@/lib/adm-auth'
import { z } from 'zod'

const schema = z.object({
  restaurantName: z.string().min(1).max(100),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  locale: z.enum(['BR', 'PT']).optional().default('BR'),
})

export async function POST(request: Request) {
  // Requer sessão Supabase Auth
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { restaurantName, slug, locale } = parsed.data
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verifica slug único
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este endereço já está em uso. Tente outro.' }, { status: 409 })
  }

  // Trial de 7 dias
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Cria restaurante com plano free
  const { error: insertError } = await supabase.from('restaurants').insert({
    owner_id: user.id,
    name: restaurantName,
    slug,
    is_active: true,
    plan: 'free',
    trial_ends_at: trialEndsAt,
    currency: locale === 'PT' ? 'EUR' : 'BRL',
  })

  if (insertError) {
    console.error('Erro ao criar restaurante free:', insertError)
    return NextResponse.json({ error: 'Erro ao criar restaurante.' }, { status: 500 })
  }

  // Buscar ID do restaurante recém-criado
  const { data: newRestaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!newRestaurant) {
    return NextResponse.json({ error: 'Erro ao buscar restaurante criado.' }, { status: 500 })
  }

  // Adicionar dono em restaurant_users (role=owner) — captura o ID para o token ADM
  const sessionId = crypto.randomUUID()
  const { data: newMember } = await supabase
    .from('restaurant_users')
    .insert({
      restaurant_id: newRestaurant.id,
      user_id: user.id,
      role: 'owner',
      session_id: sessionId,
    })
    .select('id')
    .single()

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

    // Copiar tema do template
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
  if (user.email) {
    queueOnboardingEmails(newRestaurant.id, user.email).catch((err) =>
      console.error('Erro ao enfileirar e-mails:', err)
    )
  }

  // Auto-login ADM: o usuário já está autenticado via Supabase Auth (confiança maior),
  // então geramos o cookie ADM diretamente sem exigir senha.
  const response = NextResponse.json({ slug }, { status: 201 })

  if (newMember?.id) {
    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Dono'

    const token = await createAdmToken(slug, 'owner', displayName, newMember.id, sessionId)
    const cookieName = admCookieName(slug)
    const secure = process.env.NODE_ENV === 'production'
    const secureFlag = secure ? '; Secure' : ''

    response.headers.append(
      'Set-Cookie',
      `${cookieName}=${token}; Path=/; HttpOnly; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secureFlag}`
    )
  }

  return response
}
