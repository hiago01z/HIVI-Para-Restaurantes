import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MenuHeaderClient } from './_components/menu-header-client'
import { FeaturedCarousel } from './_components/featured-carousel'

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
    .select('banner_url, primary_color, background_color')
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
    <div className="min-h-screen pb-24" style={{ color: 'white' }}>

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
          <Image
            src={theme.banner_url}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
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
              className="text-lg font-black mb-3"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Destaques
            </h2>
            <FeaturedCarousel products={featured} slug={slug} />
          </section>
        )}

        {/* Categorias — grid 2 colunas */}
        {cats.length > 0 && (
          <section className="mb-8">
            <h2
              className="text-lg font-black mb-3"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Cardápio
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${slug}/categoria/${cat.id}`}
                  className="relative rounded-2xl overflow-hidden aspect-square flex items-end"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-4xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      🍽️
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)' }}
                  />
                  <span
                    className="relative z-10 px-3 pb-3 font-black text-white text-sm leading-tight w-full"
                    style={{ fontFamily: 'var(--menu-font)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Estado vazio */}
        {featured.length === 0 && cats.length === 0 && (
          <div className="mt-24 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-white/60 text-lg font-bold">{restaurant.name}</p>
            <p className="text-white/30 text-sm mt-2">Cardápio sendo configurado...</p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      {(restaurant.instagram_url || restaurant.whatsapp_number) && (
        <footer className="px-4 py-8 mt-4 text-center border-t border-white/10">
          <p className="text-white/30 text-xs mb-3">Siga e fale com a gente</p>
          <div className="flex justify-center gap-4">
            {restaurant.instagram_url && (
              <a
                href={restaurant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
                Instagram
              </a>
            )}
            {restaurant.whatsapp_number && (
              <a
                href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
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
