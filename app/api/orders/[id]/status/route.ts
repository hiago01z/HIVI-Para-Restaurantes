import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
})

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  confirmed: '✅ Seu pedido foi confirmado! Em breve começaremos a preparar.',
  preparing: '👨‍🍳 Seu pedido está sendo preparado com carinho!',
  ready: '✅ Seu pedido está pronto!',
  out_for_delivery: '🛵 Seu pedido saiu para entrega! Aguarde em breve.',
  delivered: '😊 Pedido entregue! Obrigado pela preferência.',
  cancelled: '❌ Infelizmente seu pedido foi cancelado. Entre em contato conosco.',
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Busca o pedido para obter o slug do restaurante (necessário para verificar o ADM)
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('id, restaurant_id, restaurants(slug)')
      .eq('id', id)
      .single()

    if (!orderCheck) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verifica autenticação ADM (token no cookie) — protege contra acesso não autorizado
    const slug = (orderCheck.restaurants as unknown as { slug: string } | null)?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }
    const cookieStore = await cookies()
    const token = cookieStore.get(admCookieName(slug))?.value
    const validAdm = token ? await verifyAdmToken(slug, token) : false
    if (!validAdm) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, restaurants(name, whatsapp_number)')
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
    }

    // Disparar WhatsApp apenas para pedidos de entrega (fire-and-forget — não bloqueia a resposta)
    if (order.type === 'delivery' && order.customer_phone && ORDER_STATUS_MESSAGES[parsed.data.status]) {
      const restaurantName = (order.restaurants as { name: string })?.name ?? 'Restaurante'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const trackingUrl = `${appUrl}/${slug}/meu-pedido/${id}`
      const message = `*${restaurantName}*\n\nPedido #${order.order_number}\n\n${ORDER_STATUS_MESSAGES[parsed.data.status]}\n\n📍 Acompanhe seu pedido:\n${trackingUrl}`

      fetch(`${appUrl}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
        },
        body: JSON.stringify({ phone: order.customer_phone, message }),
      }).catch(() => {})
    }

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
