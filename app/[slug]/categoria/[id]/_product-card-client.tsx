'use client'

import { useState } from 'react'
import Image from 'next/image'
import { UtensilsCrossed, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import { ProductOptionsModal } from '../../_components/product-options-modal'
import { createClient } from '@/lib/supabase/client'

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  /** Pre-computed server-side: product has at least one option group */
  hasOptions?: boolean
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CategoryProductCard({ product, slug }: { product: Product; slug: string }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [checking, setChecking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalGoToPedido, setModalGoToPedido] = useState(false)

  async function checkAndAct(goToPedido: boolean) {
    // If server already told us whether product has options, skip the check fetch
    if (product.hasOptions === false) {
      doAdd(goToPedido)
      return
    }
    if (product.hasOptions === true) {
      setModalGoToPedido(goToPedido)
      setModalOpen(true)
      return
    }

    // Fallback: lazy check (happens when hasOptions not passed from server)
    setChecking(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('product_option_groups')
      .select('id')
      .eq('product_id', product.id)
      .limit(1)
    setChecking(false)

    if (data && data.length > 0) {
      setModalGoToPedido(goToPedido)
      setModalOpen(true)
    } else {
      doAdd(goToPedido)
    }
  }

  function doAdd(goToPedido: boolean) {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    if (goToPedido) {
      router.push(`/${slug}/pedido`)
    } else {
      setAdded(true)
      setTimeout(() => setAdded(false), 1200)
    }
  }

  return (
    <>
      <div
        className="flex gap-3 rounded-2xl p-3"
        style={{ background: 'var(--menu-card)' }}
      >
        {/* Imagem */}
        {product.image_url ? (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          </div>
        ) : (
          <div
            className="w-20 h-20 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            🍽️
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--menu-text)' }}>
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--menu-text-muted)' }}>
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <span className="font-black text-sm" style={{ color: 'var(--menu-primary)' }}>
              {formatPrice(product.price)}
            </span>

            <div className="flex items-center gap-1.5">
              {/* Adicionar ao prato */}
              <button
                onClick={() => checkAndAct(false)}
                disabled={checking}
                title="Adicionar ao prato"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: added ? '#22c55e' : 'var(--menu-card)',
                  border: `1.5px solid ${added ? '#22c55e' : 'var(--menu-primary)'}`,
                  color: added ? '#fff' : 'var(--menu-primary)',
                }}
              >
                {checking
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : added
                    ? <Check className="w-4 h-4" />
                    : <UtensilsCrossed className="w-4 h-4" />
                }
              </button>

              {/* Pedir — adiciona e vai para o pedido */}
              <button
                onClick={() => checkAndAct(true)}
                disabled={checking}
                className="px-4 py-1.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'var(--menu-primary)',
                  color: 'var(--menu-text-on-primary)',
                  opacity: checking ? 0.6 : 1,
                }}
              >
                Pedir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Options Modal */}
      {modalOpen && (
        <ProductOptionsModal
          product={product}
          slug={slug}
          goToPedido={modalGoToPedido}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
