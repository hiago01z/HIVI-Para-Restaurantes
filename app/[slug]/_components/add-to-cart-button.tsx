'use client'

import { useCart } from '@/contexts/cart-context'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductOptionsModal } from './product-options-modal'

type Props = {
  product: {
    id: string
    name: string
    price: number
    image_url?: string | null
    hasOptions?: boolean
  }
  slug: string
  className?: string
  label?: string
}

export function AddToCartButton({ product, slug, className, label = 'Pedir agora' }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [checking, setChecking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  async function handleAdd() {
    if (product.hasOptions === false) {
      doAdd()
      return
    }
    if (product.hasOptions === true) {
      setModalOpen(true)
      return
    }

    // Lazy check
    setChecking(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('product_option_groups')
      .select('id')
      .eq('product_id', product.id)
      .limit(1)
    setChecking(false)

    if (data && data.length > 0) {
      setModalOpen(true)
    } else {
      doAdd()
    }
  }

  function doAdd() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <>
      <button
        onClick={handleAdd}
        disabled={checking}
        className={`flex items-center justify-center gap-1.5 font-bold transition-all rounded-xl ${className ?? ''}`}
        style={{ background: added ? '#22c55e' : 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
      >
        {checking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : added ? (
          <>
            <Check className="w-4 h-4" />
            Adicionado
          </>
        ) : (
          label
        )}
      </button>

      {modalOpen && (
        <ProductOptionsModal
          product={product}
          slug={slug}
          goToPedido={false}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
