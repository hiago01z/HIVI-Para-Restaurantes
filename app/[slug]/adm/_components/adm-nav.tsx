'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ShoppingBag, UtensilsCrossed, LayoutGrid, Settings, Users,
  X, Menu, LogOut, ExternalLink,
} from 'lucide-react'

// Cargos que podem acessar cada página do ADM
const PAGE_ROLES: Record<string, string[]> = {
  pedidos:      ['owner', 'manager', 'cook', 'waiter', 'delivery'],
  categorias:   ['owner', 'manager'],
  pratos:       ['owner', 'manager'],
  funcionarios: ['owner', 'manager'],
  configuracoes:['owner', 'manager'],
}

const ALL_NAV_ITEMS = [
  { href: 'pedidos',       label: 'Pedidos',        icon: ShoppingBag },
  { href: 'categorias',    label: 'Categorias',      icon: LayoutGrid },
  { href: 'pratos',        label: 'Pratos/Bebidas',  icon: UtensilsCrossed },
  { href: 'funcionarios',  label: 'Equipe',          icon: Users },
  { href: 'configuracoes', label: 'Configurações',   icon: Settings },
]

const ROLE_LABEL: Record<string, string> = {
  owner:    'Dono',
  manager:  'Gerente',
  cook:     'Cozinheiro',
  waiter:   'Garçom',
  delivery: 'Entregador',
}

const ROLE_COLOR: Record<string, string> = {
  owner:    'bg-orange-100 text-orange-700',
  manager:  'bg-blue-100 text-blue-700',
  cook:     'bg-purple-100 text-purple-700',
  waiter:   'bg-green-100 text-green-700',
  delivery: 'bg-yellow-100 text-yellow-700',
}

type Props = {
  slug: string
  restaurantName: string
  logoUrl?: string | null
  primaryColor?: string
  memberRole?: string
  memberName?: string
}

export function AdmNav({
  slug,
  restaurantName,
  logoUrl,
  primaryColor = '#FF6B00',
  memberRole = 'owner',
  memberName,
}: Props) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filtra itens de nav que o cargo atual pode acessar
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => (PAGE_ROLES[item.href] ?? []).includes(memberRole)
  )

  async function handleSignout() {
    await fetch(`/api/adm/${slug}/logout`, { method: 'POST' })
    window.location.href = `/${slug}/adm/login`
  }

  function isActive(href: string) {
    return pathname.includes(`/${slug}/adm/${href}`)
  }

  const roleLabel = ROLE_LABEL[memberRole] ?? memberRole
  const roleColor = ROLE_COLOR[memberRole] ?? 'bg-gray-100 text-gray-600'

  return (
    <>
      {/* Top bar fixa */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shadow-sm">

        {/* Logo/Nome + badge de cargo */}
        <Link href={`/${slug}/adm/pedidos`} className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={restaurantName} className="h-7 w-auto object-contain max-w-[90px] flex-shrink-0" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{ background: primaryColor, color: 'var(--adm-text-on-primary, #fff)' }}
            >
              {restaurantName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-sm tracking-tight truncate">{restaurantName}</span>
          {/* Badge de cargo — visível só em sm+ para não travar o layout */}
          <span className={`hidden sm:inline-flex text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${roleColor}`}>
            {roleLabel}
          </span>
        </Link>

        {/* Nav desktop */}
        <div className="hidden sm:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={`/${slug}/adm/${item.href}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={active
                  ? { background: primaryColor + '18', color: primaryColor }
                  : { color: '#6b7280' }
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
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
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
              <div>
                <span className="font-bold tracking-tight text-gray-900 block">Menu</span>
                {/* Nome + cargo no drawer mobile */}
                {memberName && (
                  <span className="text-xs text-gray-500">{memberName}</span>
                )}
                <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 py-2">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={`/${slug}/adm/${item.href}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                    style={active
                      ? { background: primaryColor + '18', color: primaryColor }
                      : { color: '#4b5563' }
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
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
