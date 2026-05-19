'use client'

import { useState } from 'react'
import { Menu, X, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

interface AdmHeaderProps {
  restaurantName: string
  slug: string
}

export function AdmHeader({ restaurantName, slug }: AdmHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          <div>
            <p className="font-bold text-sm leading-none">{restaurantName}</p>
            <p className="text-xs text-muted-foreground">Administração</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(true)} className="p-2">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-bold">{restaurantName}</span>
            <button onClick={() => setMenuOpen(false)} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col p-4 gap-1">
            {[
              { href: `/${slug}/adm/pedidos`, label: 'Pedidos' },
              { href: `/${slug}/adm/categorias`, label: 'Categorias' },
              { href: `/${slug}/adm/pratos`, label: 'Pratos/Bebidas' },
              { href: `/${slug}/adm/configuracoes`, label: 'Configurações' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-md hover:bg-accent text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
