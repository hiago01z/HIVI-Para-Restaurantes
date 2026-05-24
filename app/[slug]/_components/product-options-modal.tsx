'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Loader2, Plus, Check, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart, makeCartKey, type SelectedOption } from '@/contexts/cart-context'
import { useFormatPrice } from '@/contexts/currency-context'
import { useRouter } from 'next/navigation'

type OptionItem = {
  id: string
  name: string
  price_addition: number
  is_available: boolean
}

type OptionGroup = {
  id: string
  name: string
  description: string | null
  min_selections: number
  max_selections: number
  items: OptionItem[]
}

type Product = {
  id: string
  name: string
  price: number
  image_url?: string | null
}

type Props = {
  product: Product
  slug: string
  /** If true, after adding to cart → navigate to /{slug}/pedido */
  goToPedido?: boolean
  onClose: () => void
}

export function ProductOptionsModal({ product, slug, goToPedido = false, onClose }: Props) {
  const { addItem } = useCart()
  const formatPrice = useFormatPrice()
  const router = useRouter()

  const [groups, setGroups] = useState<OptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  /** Map of group_id → array of selected item_ids */
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  // Fetch option groups for this product
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('product_option_groups')
      .select('id, name, description, min_selections, max_selections, sort_order, product_option_items(id, name, price_addition, is_available, sort_order)')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const parsed: OptionGroup[] = data.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            min_selections: g.min_selections,
            max_selections: g.max_selections,
            items: ((g.product_option_items as OptionItem[] | null) ?? [])
              .filter((i) => i.is_available)
              .sort((a, b) => (a as unknown as { sort_order: number }).sort_order - (b as unknown as { sort_order: number }).sort_order),
          }))
          setGroups(parsed)
        } else {
          // No options — add directly to cart and close
          handleDirectAdd()
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  function handleDirectAdd() {
    addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })
    if (goToPedido) {
      router.push(`/${slug}/pedido`)
    }
    onClose()
  }

  function toggleItem(group: OptionGroup, itemId: string) {
    setSelections((prev) => {
      const current = prev[group.id] ?? []
      if (current.includes(itemId)) {
        // Deselect
        return { ...prev, [group.id]: current.filter((id) => id !== itemId) }
      }
      if (group.max_selections === 1) {
        // Single select (radio behaviour)
        return { ...prev, [group.id]: [itemId] }
      }
      // Multi select — cap at max
      if (current.length >= group.max_selections) {
        // Replace oldest selection with new one
        return { ...prev, [group.id]: [...current.slice(1), itemId] }
      }
      return { ...prev, [group.id]: [...current, itemId] }
    })
  }

  function validate(): boolean {
    for (const group of groups) {
      if (group.min_selections > 0) {
        const selected = (selections[group.id] ?? []).length
        if (selected < group.min_selections) {
          setError(`Escolha ${group.min_selections === 1 ? 'uma opção' : `${group.min_selections} opções`} em "${group.name}"`)
          return false
        }
      }
    }
    setError('')
    return true
  }

  function buildSelectedOptions(): SelectedOption[] {
    const result: SelectedOption[] = []
    for (const group of groups) {
      const selectedIds = selections[group.id] ?? []
      for (const itemId of selectedIds) {
        const item = group.items.find((i) => i.id === itemId)
        if (item) {
          result.push({
            group_id: group.id,
            group_name: group.name,
            item_id: item.id,
            item_name: item.name,
            price_addition: item.price_addition,
          })
        }
      }
    }
    return result
  }

  function handleAdd(pedido: boolean) {
    if (!validate()) return
    setAdding(true)

    const selectedOptions = buildSelectedOptions()
    const cartKey = makeCartKey(product.id, selectedOptions)

    addItem({
      id: product.id,
      cartKey,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
    })

    if (pedido) {
      router.push(`/${slug}/pedido`)
    }
    onClose()
  }

  // Extra price from selected options
  const optionsExtra = buildSelectedOptions().reduce((s, o) => s + o.price_addition, 0)
  const totalUnit = product.price + optionsExtra

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full max-w-md rounded-t-3xl px-6 py-10 flex justify-center" style={{ background: 'var(--menu-bg)' }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--menu-primary)' }} />
        </div>
      </div>
    )
  }

  // groups.length === 0 means handleDirectAdd was called — don't render the modal UI
  if (groups.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--menu-bg)', maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(128,128,128,0.15)' }}
        >
          <div className="flex items-center gap-3">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(128,128,128,0.12)' }}
              >🍽️</div>
            )}
            <div>
              <p className="font-black text-sm leading-tight" style={{ color: 'var(--menu-text)' }}>{product.name}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--menu-primary)' }}>{formatPrice(product.price)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--menu-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Groups */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {groups.map((group) => {
            const selected = selections[group.id] ?? []
            const isRequired = group.min_selections > 0
            const label = group.max_selections === 1 ? 'Escolha 1' : `Escolha até ${group.max_selections}`

            return (
              <div key={group.id}>
                {/* Group header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-sm" style={{ color: 'var(--menu-text)' }}>
                      {group.name}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    {group.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--menu-text-muted)' }}>{group.description}</p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3"
                    style={{
                      background: isRequired ? 'rgba(239,68,68,0.12)' : 'rgba(128,128,128,0.1)',
                      color: isRequired ? '#ef4444' : 'var(--menu-text-muted)',
                    }}
                  >
                    {isRequired ? 'Obrigatório' : label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isSelected = selected.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(group, item.id)}
                        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all text-left"
                        style={{
                          background: isSelected
                            ? 'color-mix(in srgb, var(--menu-primary) 12%, var(--menu-bg))'
                            : 'var(--menu-card)',
                          border: `1.5px solid ${isSelected ? 'var(--menu-primary)' : 'transparent'}`,
                        }}
                      >
                        {/* Check indicator */}
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all"
                          style={{
                            borderColor: isSelected ? 'var(--menu-primary)' : 'rgba(128,128,128,0.35)',
                            background: isSelected ? 'var(--menu-primary)' : 'transparent',
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3" style={{ color: 'var(--menu-text-on-primary)' }} />}
                        </div>

                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--menu-text)' }}>
                          {item.name}
                        </span>

                        {item.price_addition > 0 && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--menu-primary)' }}>
                            +{formatPrice(item.price_addition)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-center font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer — price + action buttons */}
        <div
          className="px-5 py-4 space-y-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(128,128,128,0.15)' }}
        >
          {optionsExtra > 0 && (
            <div className="flex justify-between items-center px-1 mb-1">
              <span className="text-xs" style={{ color: 'var(--menu-text-muted)' }}>Total unitário</span>
              <span className="text-sm font-black" style={{ color: 'var(--menu-text)' }}>{formatPrice(totalUnit)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Add to plate */}
            <button
              onClick={() => handleAdd(false)}
              disabled={adding}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: 'var(--menu-card)',
                color: 'var(--menu-text)',
                border: '1px solid rgba(128,128,128,0.20)',
              }}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Adicionar
            </button>

            {/* Order now */}
            <button
              onClick={() => handleAdd(true)}
              disabled={adding}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
            >
              <Plus className="w-4 h-4" />
              Pedir agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

