export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: process.env.ULTRAMSG_TOKEN!,
          to: phone,
          body: message,
        }),
      }
    )
    return response.ok
  } catch {
    return false
  }
}

export const ORDER_STATUS_MESSAGES: Record<string, string> = {
  confirmed: '✅ Seu pedido foi confirmado! Em breve começaremos a preparar.',
  preparing: '👨‍🍳 Seu pedido está sendo preparado com carinho!',
  ready: '✅ Seu pedido está pronto!',
  out_for_delivery: '🛵 Seu pedido saiu para entrega! Aguarde.',
  delivered: '😊 Pedido entregue! Obrigado pela preferência.',
  cancelled: '❌ Seu pedido foi cancelado. Entre em contato conosco.',
}

export function buildOrderStatusMessage(
  restaurantName: string,
  orderNumber: number,
  status: string
): string {
  const statusMsg = ORDER_STATUS_MESSAGES[status]
  if (!statusMsg) return ''
  return `*${restaurantName}*\n\nPedido #${orderNumber}\n\n${statusMsg}`
}
