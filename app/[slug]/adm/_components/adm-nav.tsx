'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import {
  ShoppingBag, UtensilsCrossed, LayoutGrid, Settings,
  X, Menu, LogOut, ExternalLink,
} from 'lucide-react'

type Props = {
  slug: string
  restaurantName: string
  logoUrl?: string | null
  role: string
}

const navItems = [
  { href: 'pedidos',       label: 'Pedidos',         icon: ShoppingBag,     roles: ['owner', 'admin', 'waiter'] },
  { href: 'categorias',    label: 'Categorias',       icon: LayoutGrid,      roles: ['owner', 'admin'] },
  { href: 'pratos',        label: 'Pratos/Bebidas',   icon: UtensilsCrossed, roles: ['owner', 'admin'] },
  { href: 'configuracoes', label: 'Configurações',    icon: Settings,        roles: ['owner', 'admin'] },
]

export function AdmNav({ slug, restaurantName, logoUrl, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  async function handleSignout() {
    await fetch(`/api/adm/${slug}/logout`, { method: 'POST' })
    router.push(`/${slug}/adm/login`)
    router.refresh()
  }

  function isActive(href: string) {
    return pathname.includes(`/${slug}/adm/${href}`)
  }

  return (
    <>
      {/* Top bar fixa */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
        {/* Logo/Nome */}
        <Link href={`/${slug}/adm/pedidos`} className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={restaurantName} width={28} height={28} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-gray-900 text-sm truncate">{restaurantName}</span>
          <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">— ADM</span>
        </Link>

        {/* Nav desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={`/${slug}/adm/${item.href}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <Link
            href={`/${slug}`}
            target="_blank"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Ver cardápio"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignout}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <span className="font-black text-gray-900">Menu</span>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 py-2">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${slug}/adm/${item.href}`}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-100 p-4 space-y-2">
              <Link
                href={`/${slug}`}
                target="_blank"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
              >
                <ExternalLink className="w-4 h-4" />
                Ver cardápio
              </Link>
              <button
                onClick={handleSignout}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 w-full"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
