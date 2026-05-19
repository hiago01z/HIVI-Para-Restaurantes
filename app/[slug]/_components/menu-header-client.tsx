'use client'

import Link from 'next/link'
import { UtensilsCrossed, Search, X, Menu } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Category = { id: string; name: string }

type Props = {
  slug: string
  restaurantName: string
  logoUrl?: string | null
  categories: Category[]
  allProducts: { id: string; name: string; description?: string | null; price: number; image_url?: string | null; category_id?: string | null }[]
}

export function MenuHeaderClient({ slug, restaurantName, logoUrl, categories, allProducts }: Props) {
  const { totalItems } = useCart()
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const results = query.trim().length >= 2
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <>
      {/* Header fixo */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 py-3 gap-3"
        style={{ background: 'var(--menu-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Logo / Nome */}
        <Link href={`/${slug}`} className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={restaurantName} width={32} height={32} className="rounded-full object-cover w-8 h-8 flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: 'var(--menu-primary)' }}
            >
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-white truncate text-sm">{restaurantName}</span>
        </Link>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSearchOpen(true); setDrawerOpen(false) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            href={`/${slug}/pedido`}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <UtensilsCrossed className="w-5 h-5" />
            {totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center"
                style={{ background: 'var(--menu-primary)' }}
              >
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => { setDrawerOpen(true); setSearchOpen(false) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Busca overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--menu-bg)' }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pratos e bebidas..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-base focus:outline-none"
            />
            <button onClick={() => { setSearchOpen(false); setQuery('') }}>
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-white/40 text-center mt-10">Nenhum item encontrado</p>
            )}
            {results.map((p) => (
              <SearchResultItem key={p.id} product={p} onClose={() => { setSearchOpen(false); setQuery('') }} />
            ))}
          </div>
        </div>
      )}

      {/* Drawer de categorias */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col"
            style={{ background: 'var(--menu-bg)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-white font-bold text-lg">Categorias</span>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${slug}/categoria/${cat.id}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center px-5 py-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function SearchResultItem({
  product,
  onClose,
}: {
  product: { id: string; name: string; description?: string | null; price: number; image_url?: string | null }
  onClose: () => void
}) {
  const { addItem } = useCart()

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-white/5 cursor-pointer"
      onClick={() => {
        addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
        onClose()
      }}
    >
      {product.image_url ? (
        <Image src={product.image_url} alt={product.name} width={56} height={56} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">{product.name}</p>
        {product.description && (
          <p className="text-white/50 text-xs truncate mt-0.5">{product.description}</p>
        )}
        <p className="text-sm font-bold mt-1" style={{ color: 'var(--menu-primary)' }}>
          {formatPrice(product.price)}
        </p>
      </div>
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
        style={{ background: 'var(--menu-primary)' }}
      >
        +
      </button>
    </div>
  )
}
