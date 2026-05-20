'use client'

import { useState } from 'react'
import Image from 'next/image'
import { UtensilsCrossed, Check } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CategoryProductCard({ product, slug }: { product: Product; slug: string }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  function handleOrder() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    router.push(`/${slug}/pedido`)
  }

  return (
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
            {/* Adicionar ao prato (só adiciona ao carrinho) */}
            <button
              onClick={handleAdd}
              title="Adicionar ao prato"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: added ? '#22c55e' : 'var(--menu-card)',
                border: `1.5px solid ${added ? '#22c55e' : 'var(--menu-primary)'}`,
                color: added ? '#fff' : 'var(--menu-primary)',
              }}
            >
              {added
                ? <Check className="w-4 h-4" />
                : <UtensilsCrossed className="w-4 h-4" />
              }
            </button>

            {/* Pedir — adiciona e vai para o pedido */}
            <button
              onClick={handleOrder}
              className="px-4 py-1.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'var(--menu-primary)',
                color: 'var(--menu-text-on-primary)',
              }}
            >
              Pedir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
