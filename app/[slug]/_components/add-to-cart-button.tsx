'use client'

import { useCart } from '@/contexts/cart-context'
import { useState } from 'react'
import { Check } from 'lucide-react'

type Props = {
  product: {
    id: string
    name: string
    price: number
    image_url?: string | null
  }
  className?: string
  label?: string
}

export function AddToCartButton({ product, className, label = 'Pedir agora' }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex items-center justify-center gap-1.5 font-bold text-white transition-all rounded-xl ${className ?? ''}`}
      style={{ background: added ? '#22c55e' : 'var(--menu-primary)' }}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Adicionado
        </>
      ) : (
        label
      )}
    </button>
  )
}
