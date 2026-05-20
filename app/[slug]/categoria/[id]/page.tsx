import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MenuHeaderClient } from '../../_components/menu-header-client'
import { CategoryProductCard } from './_product-card-client'

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

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, slug, name, logo_url, is_active')
    .eq('id', category.restaurant_id)
    .single()

  // is_active === null → restaurante novo, trata como ativo
  if (!restaurant || restaurant.is_active === false || restaurant.slug !== slug) notFound()

  const ascending = ordem === 'menor'

  // Busca em paralelo: produtos da categoria + todas as categorias + todos os produtos (para header)
  const [
    { data: products },
    { data: allCategories },
    { data: allProducts },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('category_id', id)
      .eq('is_available', true)
      .order('price', { ascending }),
    supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true),
  ])

  const pratos = products ?? []

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--menu-text)' }}>

      {/* Header fixo com busca + categorias + carrinho */}
      <MenuHeaderClient
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        categories={allCategories ?? []}
        allProducts={allProducts ?? []}
      />

      {/* Espaço do header fixo */}
      <div className="h-14" />

      {/* Hero com imagem da categoria */}
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
          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Nome da categoria */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1
            className="text-3xl leading-tight"
            style={{
              fontFamily: 'var(--label-font)',
              color: 'var(--label-color)',
              textShadow: 'var(--label-text-shadow)',
            }}
          >
            {category.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--label-color)', opacity: 0.6 }}>
            {pratos.length} {pratos.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>

      {/* Ordenação */}
      <div className="px-4 mt-4 mb-4">
        <CategorySortButtons currentSort={ordem ?? 'maior'} slug={slug} id={id} />
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
            <CategoryProductCard key={product.id} product={product} slug={slug} />
          ))
        )}
      </div>
    </div>
  )
}

/** Botões de ordenação — server component simples usando searchParams */
function CategorySortButtons({ currentSort, slug, id }: { currentSort: string; slug: string; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs self-center mr-1 font-medium" style={{ color: 'var(--menu-text-muted)' }}>Ordenar:</span>
      {[
        { value: 'maior', label: 'Maior preço' },
        { value: 'menor', label: 'Menor preço' },
      ].map((opt) => (
        <Link
          key={opt.value}
          href={`/${slug}/categoria/${id}?ordem=${opt.value}`}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
          style={{
            background: currentSort === opt.value ? 'var(--menu-primary)' : 'var(--menu-card)',
            color: currentSort === opt.value ? 'var(--menu-text-on-primary)' : 'var(--menu-text-muted)',
          }}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  )
}
