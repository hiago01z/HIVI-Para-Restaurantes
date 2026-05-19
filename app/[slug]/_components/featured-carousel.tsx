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

export function FeaturedCarousel({ products, slug }: { products: Product[]; slug: string }) {
  const [current, setCurrent] = useState(0)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const router = useRouter()

  if (products.length === 0) return null

  const product = products[current]

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function handleAddToCart() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  function handleOrderNow() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    router.push(`/${slug}/pedido`)
  }

  function prev() { setAdded(false); setCurrent((c) => (c - 1 + products.length) % products.length) }
  function next() { setAdded(false); setCurrent((c) => (c + 1) % products.length) }

  return (
    <div className="mb-5">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden">

        {/* Foto */}
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-20"
            style={{ background: 'var(--menu-card)' }}>🍽️</div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 50%, transparent 75%)' }} />

        {/* Preço — topo direito */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full font-black text-sm"
          style={{ background: 'var(--menu-primary)', color: 'var(--menu-text)' }}
        >
          {formatPrice(product.price)}
        </div>

        {/* Dots — topo centro */}
        {products.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {products.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '18px' : '6px',
                  height: '6px',
                  background: i === current ? 'var(--menu-primary)' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        )}

        {/* Setas laterais */}
        {products.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-xl"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'var(--menu-text)', backdropFilter: 'blur(4px)' }}>
              ‹
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-xl"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'var(--menu-text)', backdropFilter: 'blur(4px)' }}>
              ›
            </button>
          </>
        )}

        {/* Infos + botões — rodapé */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-black text-xl leading-tight" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font)' }}>
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs leading-relaxed line-clamp-2 mt-1 mb-3" style={{ color: 'var(--menu-text-muted)' }}>
              {product.description}
            </p>
          )}
          {!product.description && <div className="mt-3" />}

          <div className="flex gap-2">
            {/* Pedir agora */}
            <button
              onClick={handleOrderNow}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text)' }}
            >
              Pedir agora
            </button>

            {/* Adicionar ao prato */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: added ? '#22c55e' : 'rgba(255,255,255,0.15)',
                color: 'var(--menu-text)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {added
                ? <><Check className="w-4 h-4" /> Adicionado</>
                : <><UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--menu-icon)' }} /> Adicionar ao prato</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
