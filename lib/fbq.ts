/**
 * Meta Pixel (fbq) — utilitários tipados
 * Chama window.fbq de forma segura (sem crash se o Pixel não carregou)
 */

type FbqEvent =
  | 'PageView'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'ViewContent'

interface PurchaseParams {
  value: number
  currency: 'BRL' | 'EUR'
  content_name?: string
}

interface InitiateCheckoutParams {
  value: number
  currency: 'BRL' | 'EUR'
  content_name?: string
  num_items?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fbq(event: FbqEvent, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _fbq = (window as any).fbq
  if (typeof _fbq !== 'function') return
  if (params) {
    _fbq('track', event, params)
  } else {
    _fbq('track', event)
  }
}

/** Usuário demonstrou intenção de criar um cardápio */
export function trackLead() {
  fbq('Lead')
}

/** Restaurante gratuito criado com sucesso */
export function trackCompleteRegistration(params?: { content_name?: string }) {
  fbq('CompleteRegistration', { content_name: params?.content_name ?? 'Plano Gratuito' })
}

/** Usuário iniciou checkout Stripe (planos pagos) */
export function trackInitiateCheckout(params: InitiateCheckoutParams) {
  fbq('InitiateCheckout', params)
}

/** Pagamento confirmado — usuário chegou em /conta?success=1 */
export function trackPurchase(params: PurchaseParams) {
  fbq('Purchase', params)
}
