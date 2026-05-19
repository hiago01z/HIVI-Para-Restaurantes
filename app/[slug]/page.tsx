import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MenuHeaderClient } from './_components/menu-header-client'
import { FeaturedCarousel } from './_components/featured-carousel'

type Category = { id: string; name: string; image_url: string | null; display_order: number }

function CategoryCard({ cat, slug, large = false }: { cat: Category; slug: string; large?: boolean }) {
  return (
    <Link
      href={`/${slug}/categoria/${cat.id}`}
      className={`relative rounded-2xl overflow-hidden flex items-end ${large ? 'aspect-video' : 'aspect-square'}`}
      style={{ background: 'var(--menu-card)' }}
    >
      {cat.image_url ? (
        <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
          🍽️
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)' }}
      />
      <span
        className="relative z-10 px-3 pb-3 font-bold text-base leading-snug tracking-wide w-full"
        style={{
          fontFamily: 'var(--menu-font)',
          color: 'var(--menu-text)',
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
        }}
      >
        {cat.name}
      </span>
    </Link>
  )
}

function CategoriesGrid({ cats, slug }: { cats: Category[]; slug: string }) {
  if (cats.length === 0) return null

  // Padrão: 2 pequenos, 1 grande, 2 pequenos, 1 grande...
  // Processa em grupos de 3: [A,B] pequenos + [C] grande
  const rows: React.ReactNode[] = []
  let i = 0

  while (i < cats.length) {
    const a = cats[i]
    const b = cats[i + 1]
    const c = cats[i + 2]

    // Par pequeno (A e B)
    if (a && b) {
      rows.push(
        <div key={`pair-${i}`} className="grid grid-cols-2 gap-2">
          <CategoryCard cat={a} slug={slug} />
          <CategoryCard cat={b} slug={slug} />
        </div>
      )
    } else if (a) {
      // Sobrou só 1 → exibe grande
      rows.push(<CategoryCard key={a.id} cat={a} slug={slug} large />)
      i += 1
      continue
    }

    // Grande (C)
    if (c) {
      rows.push(<CategoryCard key={c.id} cat={c} slug={slug} large />)
    }

    i += 3
  }

  return <div className="flex flex-col gap-2">{rows}</div>
}

export default async function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, is_active, instagram_url, whatsapp_number')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('banner_url')
    .eq('restaurant_id', restaurant.id)
    .single()

  const [{ data: categories }, { data: featuredProducts }, { data: allProducts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, image_url, display_order')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('restaurant_id', restaurant.id)
      .eq('is_featured', true)
      .eq('is_available', true),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true),
  ])

  const cats = categories ?? []
  const featured = featuredProducts ?? []
  const products = allProducts ?? []

  return (
    <div className="min-h-screen pb-24">

      <MenuHeaderClient
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        categories={cats}
        allProducts={products}
      />

      {/* Banner ou espaço do header */}
      {theme?.banner_url ? (
        <div className="relative h-44 w-full mt-14">
          <Image src={theme.banner_url} alt={restaurant.name} fill className="object-cover" priority />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--menu-bg) 100%)' }}
          />
        </div>
      ) : (
        <div className="h-14" />
      )}

      <div className="px-4">

        {/* Destaques — carrossel grande */}
        {featured.length > 0 && (
          <section className="mb-6 mt-3">
            <h2
              className="text-xl font-bold mb-3 tracking-tight"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Destaques
            </h2>
            <FeaturedCarousel products={featured} slug={slug} />
          </section>
        )}

        {/* Categorias — padrão 2 pequenos + 1 grande */}
        {cats.length > 0 && (
          <section className="mb-8">
            <h2
              className="text-xl font-bold mb-3 tracking-tight"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Cardápio
            </h2>
            <CategoriesGrid cats={cats} slug={slug} />
          </section>
        )}

        {/* Estado vazio */}
        {featured.length === 0 && cats.length === 0 && (
          <div className="mt-24 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="font-bold text-xl tracking-tight" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font)' }}>{restaurant.name}</p>
            <p className="text-sm mt-2 font-medium" style={{ color: 'var(--menu-text-muted)' }}>Cardápio sendo configurado...</p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      {(restaurant.instagram_url || restaurant.whatsapp_number) && (
        <footer className="px-4 py-8 mt-4" style={{ borderTop: '1px solid rgba(128,128,128,0.2)' }}>
          <p className="text-xs mb-3 text-center" style={{ color: 'var(--menu-text-muted)' }}>Siga e fale com a gente</p>
          <div className="flex justify-center gap-4">
            {restaurant.instagram_url && (
              <a
                href={restaurant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-opacity hover:opacity-100 opacity-60"
                style={{ color: 'var(--menu-text)' }}
              >
                Instagram
              </a>
            )}
            {restaurant.whatsapp_number && (
              <a
                href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-opacity hover:opacity-100 opacity-60"
                style={{ color: 'var(--menu-text)' }}
              >
                WhatsApp
              </a>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
