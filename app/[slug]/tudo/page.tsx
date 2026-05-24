import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MenuHeaderClient } from '../_components/menu-header-client'
import { CategoryProductCard } from '../categoria/[id]/_product-card-client'

export default async function TudoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, slug, name, logo_url, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || restaurant.is_active === false) notFound()

  // Busca categorias + produtos em paralelo
  const [{ data: categories }, { data: products }, { data: allProducts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id, product_option_groups(id)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true),
  ])

  // Normaliza produtos: calcula hasOptions
  type RawProduct = NonNullable<typeof products>[number]
  const pratos = (products ?? []).map((p: RawProduct) => {
    const { product_option_groups, ...rest } = p as RawProduct & { product_option_groups?: { id: string }[] }
    return { ...rest, hasOptions: (product_option_groups ?? []).length > 0 }
  })

  // Agrupa produtos por categoria (mantém ordem display_order das categorias, A-Z dentro de cada uma)
  const catMap = new Map(
    (categories ?? []).map((c) => [c.id, { ...c, items: [] as typeof pratos }])
  )
  const semCategoria: typeof pratos = []

  for (const p of pratos) {
    if (p.category_id && catMap.has(p.category_id)) {
      catMap.get(p.category_id)!.items.push(p)
    } else {
      semCategoria.push(p)
    }
  }

  const grupos = [...catMap.values()].filter((g) => g.items.length > 0)
  if (semCategoria.length > 0) {
    grupos.push({ id: '__sem_categoria', name: 'Outros', items: semCategoria })
  }

  const totalItens = pratos.length

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--menu-text)' }}>

      {/* Header fixo */}
      <MenuHeaderClient
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        categories={categories ?? []}
        allProducts={allProducts ?? []}
      />

      {/* Espaço do header fixo */}
      <div className="h-14" />

      {/* Hero simples */}
      <div
        className="relative px-4 pt-8 pb-6 flex items-end"
        style={{ background: 'linear-gradient(to bottom, rgba(128,128,128,0.08), transparent)' }}
      >
        {/* Botão voltar */}
        <Link
          href={`/${slug}`}
          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/30 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="mt-6">
          <h1
            className="text-3xl leading-tight"
            style={{
              fontFamily: 'var(--label-font)',
              color: 'var(--menu-text)',
            }}
          >
            Cardápio completo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--menu-text-muted)' }}>
            {totalItens} {totalItens === 1 ? 'item disponível' : 'itens disponíveis'}
          </p>
        </div>
      </div>

      {/* Grupos por categoria */}
      {grupos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🍽️</div>
          <p style={{ color: 'var(--menu-text-muted)' }}>Nenhum item disponível no momento</p>
        </div>
      ) : (
        <div className="px-4 space-y-8 mt-4">
          {grupos.map((grupo) => (
            <section key={grupo.id}>
              {/* Cabeçalho da categoria */}
              <div
                className="flex items-center gap-3 mb-3"
                style={{ borderBottom: '1px solid rgba(128,128,128,0.15)', paddingBottom: '0.5rem' }}
              >
                <h2
                  className="text-lg font-black tracking-tight"
                  style={{ color: 'var(--menu-text)' }}
                >
                  {grupo.name}
                </h2>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(128,128,128,0.12)', color: 'var(--menu-text-muted)' }}
                >
                  {grupo.items.length}
                </span>
              </div>

              {/* Produtos */}
              <div className="space-y-3">
                {grupo.items.map((product) => (
                  <CategoryProductCard key={product.id} product={product} slug={slug} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
