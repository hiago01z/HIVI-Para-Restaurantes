import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddToCartButton } from '../../_components/add-to-cart-button'
import { CategorySortClient } from './_sort-client'

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ ordem?: string }>
}) {
  const { slug, id } = await params
  const { ordem } = await searchParams

  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, image_url, restaurant_id')
    .eq('id', id)
    .single()

  if (!category) notFound()

  // Verificar se o restaurante corresponde ao slug
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, slug, is_active')
    .eq('id', category.restaurant_id)
    .single()

  if (!restaurant || !restaurant.is_active || restaurant.slug !== slug) notFound()

  const ascending = ordem === 'menor'
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .eq('category_id', id)
    .eq('is_available', true)
    .order('price', { ascending })

  const pratos = products ?? []

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--menu-text)' }}>

      {/* Header com imagem da categoria */}
      <div className="relative h-52 w-full">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            🍽️
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, var(--menu-bg) 90%)' }}
        />

        {/* Botão voltar */}
        <Link
          href={`/${slug}`}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Nome da categoria */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-black text-white">{category.name}</h1>
          <p className="text-white/50 text-sm mt-0.5">{pratos.length} {pratos.length === 1 ? 'item' : 'itens'}</p>
        </div>
      </div>

      {/* Ordenação */}
      <div className="px-4 mt-4 mb-6">
        <CategorySortClient currentSort={ordem ?? 'maior'} slug={slug} id={id} />
      </div>

      {/* Lista de produtos */}
      <div className="px-4 space-y-3">
        {pratos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🍽️</div>
            <p style={{ color: 'var(--menu-text-muted)' }}>Nenhum item disponível no momento</p>
          </div>
        ) : (
          pratos.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 rounded-2xl p-3"
              style={{ background: 'var(--menu-card)' }}
            >
              {product.image_url ? (
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 flex-shrink-0 rounded-xl flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  🍽️
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="font-bold text-sm leading-tight" style={{ color: 'var(--menu-text)' }}>{product.name}</p>
                {product.description && (
                  <p className="text-xs mt-1 leading-relaxed line-clamp-3" style={{ color: 'var(--menu-text-muted)' }}>{product.description}</p>
                )}
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <span className="font-black text-sm" style={{ color: 'var(--menu-primary)' }}>
                    {formatPrice(product.price)}
                  </span>
                  <AddToCartButton
                    product={product}
                    label="Pedir"
                    className="px-4 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
