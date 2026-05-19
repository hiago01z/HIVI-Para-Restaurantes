'use client'

import { Search, ShoppingCart, AlignJustify } from 'lucide-react'
import Image from 'next/image'

interface MenuHeaderProps {
  restaurantName: string
  logoUrl?: string | null
  cartCount?: number
}

export function MenuHeader({ restaurantName, logoUrl, cartCount = 0 }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <Image src={logoUrl} alt={restaurantName} width={32} height={32} className="rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
            {restaurantName[0]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1" aria-label="Buscar">
          <Search className="w-5 h-5" />
        </button>
        <button className="relative p-1" aria-label="Carrinho">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button className="p-1" aria-label="Menu">
          <AlignJustify className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
