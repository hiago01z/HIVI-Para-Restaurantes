import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendWhatsAppMessage } from '@/lib/ultramsg'
import { getEffectiveLimits } from '@/lib/plan-limits'
import { formatCurrency, type SupportedCurrency } from '@/lib/currency'

const orderSchema = z.object({
  restaurantId: z.string().uuid(),
  type: z.enum(['table', 'delivery']),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  table_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  change_for: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  total: z.number().positive(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    quantity: z.number().int().min(1),
    notes: z.string().optional().nullable(),
    selected_options: z.array(z.object({
      group_id: z.string(),
      group_name: z.string(),
      item_id: z.string(),
      item_name: z.string(),
      price_addition: z.number(),
    })).optional().nullable(),
  })).min(1),
})

export async function POST(request: Request) {
  // Rate limit: 10 pedidos por IP por minuto
  const ip = getClientIp(request)
  if (!rateLimit(`orders:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { restaurantId, items, total: _clientTotal, ...rest } = parsed.data

    const supabase = await createClient()

    // ── Validação server-side de preços ──────────────────────────────────
    // Nunca confiar no total enviado pelo cliente — recalcular a partir dos
    // preços reais do banco para evitar manipulação de pedidos.
    const productIds = [...new Set(items.map((i) => i.product_id))]
    const { data: dbProducts, error: priceError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds)
      .eq('restaurant_id', restaurantId)

    if (priceError || !dbProducts || dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, p.price as number]))
    const serverTotal = items.reduce((sum, item) => {
      const base = priceMap.get(item.product_id) ?? 0
      const opts = (item.selected_options ?? []).reduce((s, o) => s + o.price_addition, 0)
      return Math.round((sum + (base + opts) * item.quantity) * 100) / 100
    }, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ restaurant_id: restaurantId, total: serverTotal, ...rest })
      .select('id, order_number, type, customer_name, total')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          notes: item.notes ?? null,
          selected_options: item.selected_options?.length ? item.selected_options : null,
        }))
      )

    if (itemsError) {
      // Limpar o pedido órfão antes de retornar erro
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    // Notificar restaurante via WhatsApp apenas para pedidos de entrega
    // Usa service role para garantir acesso ao whatsapp_number independente de RLS
    if (order.type === 'delivery') {
      try {
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Buscar delivery_fee do restaurante e salvar no pedido (snapshot)
        try {
          const { data: restFee } = await serviceSupabase
            .from('restaurants')
            .select('delivery_fee')
            .eq('id', restaurantId)
            .single()
          const fee = (restFee?.delivery_fee as number | null) ?? 0
          if (fee > 0) {
            await serviceSupabase.from('orders').update({ delivery_fee: fee }).eq('id', order.id)
          }
        } catch {
          // não falha o pedido se a taxa não puder ser salva
        }

        const { data: restaurant } = await serviceSupabase
          .from('restaurants')
          .select('name, whatsapp_number, whatsapp_notify_enabled, slug, plan, trial_ends_at, currency, delivery_fee')
          .eq('id', restaurantId)
          .single()

        const planLimits = getEffectiveLimits(
          (restaurant?.plan ?? 'free') as 'free' | 'basic' | 'pro',
          restaurant?.trial_ends_at
        )

        if (restaurant?.whatsapp_number && restaurant.slug && restaurant.whatsapp_notify_enabled !== false && planLimits.whatsappEnabled) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
          const trackingUrl = `${appUrl}/${restaurant.slug}/meu-pedido/${order.id}`
          const restaurantCurrency = ((restaurant as Record<string, unknown>).currency as SupportedCurrency | undefined) ?? 'BRL'
          const itemsTotal = order.total as number
          const feeAmount = ((restaurant as Record<string, unknown>).delivery_fee as number | null) ?? 0
          const grandTotal = itemsTotal + feeAmount
          const grandTotalFormatted = formatCurrency(grandTotal, restaurantCurrency)
          const itemsTotalFormatted = formatCurrency(itemsTotal, restaurantCurrency)
          const feeFormatted = feeAmount > 0 ? formatCurrency(feeAmount, restaurantCurrency) : ''
          const customerName = (order.customer_name as string | null) ?? 'Cliente'
          const customerPhone = parsed.data.customer_phone
          const address = parsed.data.address ?? ''
          const notesLine = parsed.data.notes ? `\n📝 Obs: ${parsed.data.notes}` : ''
          const paymentLabel = parsed.data.payment_method === 'dinheiro'
            ? `Dinheiro${parsed.data.change_for ? ` (troco p/ ${formatCurrency(parsed.data.change_for, restaurantCurrency)})` : ''}`
            : parsed.data.payment_method === 'cartao' ? 'Cartão' : 'Pix'
          const itemsList = items.map((i) => {
            const opts = (i.selected_options ?? []).map((o) => `    ↳ ${o.item_name}${o.price_addition > 0 ? ` (+${formatCurrency(o.price_addition, restaurantCurrency)})` : ''}`).join('\n')
            return `  • ${i.quantity}x ${i.product_name}${opts ? '\n' + opts : ''}`
          }).join('\n')

          // Link wa.me com mensagem de confirmação pré-preenchida para o staff enviar ao cliente
          const confirmMsg =
            `✅ Olá, ${customerName}! Seu pedido foi confirmado 🎉\n\n` +
            `Estamos preparando agora. Em breve um entregador sairá para sua casa.\n\n` +
            `📍 Acompanhe em tempo real:\n${trackingUrl}`
          const waLine = customerPhone
            ? `\n\n💬 *Enviar confirmação ao cliente:*\nhttps://wa.me/${customerPhone}?text=${encodeURIComponent(confirmMsg)}`
            : ''

          const restaurantMsg =
            `🛵 *Novo pedido de entrega!*\n\n` +
            `Pedido #${order.order_number}\n` +
            `👤 Cliente: ${customerName}\n` +
            `📍 Endereço: ${address}${notesLine}\n` +
            `💳 Pagamento: ${paymentLabel}\n` +
            `💰 Total: ${grandTotalFormatted}${feeAmount > 0 ? ` (itens: ${itemsTotalFormatted} + taxa: ${feeFormatted})` : ''}\n\n` +
            `📦 Itens:\n${itemsList}` +
            waLine

          // await garante que o fetch completa antes de o Vercel encerrar a função
          await sendWhatsAppMessage(restaurant.whatsapp_number, restaurantMsg)
        }
      } catch {
        // Não falha o pedido se o WhatsApp falhar
      }
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
