import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MenuHeaderClient } from './_components/menu-header-client'
import { AddToCartButton } from './_components/add-to-cart-button'

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

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="min-h-screen pb-24" style={{ color: 'white' }}>

      <MenuHeaderClient
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        categories={cats}
        allProducts={products}
      />

      {/* Banner do restaurante */}
      {theme?.banner_url ? (
        <div className="relative h-48 w-full mt-14">
          <Image
            src={theme.banner_url}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--menu-bg) 100%)' }} />
        </div>
      ) : (
        <div className="h-14" /> /* espaço para o header fixo */
      )}

      <div className="px-4">

        {/* Destaques */}
        {featured.length > 0 && (
          <section className="mb-8">
            <h2
              className="text-2xl font-bold mb-4 mt-4"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Destaques
            </h2>
            <p className="text-white/50 text-sm -mt-3 mb-4">Nossos itens mais pedidos</p>
            <div className="grid grid-cols-2 gap-3">
              {featured.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {product.image_url ? (
                    <div className="relative w-full aspect-square">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-4xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      🍽️
                    </div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <p className="font-bold text-sm text-white leading-tight">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-white/50 mt-1 leading-relaxed line-clamp-2">{product.description}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-black" style={{ color: 'var(--menu-primary)' }}>
                        {formatPrice(product.price)}
                      </span>
                      <AddToCartButton
                        product={product}
                        label="+"
                        className="w-8 h-8 text-lg flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categorias */}
        {cats.length > 0 && (
          <section className="mb-8">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'var(--menu-font)', color: 'var(--menu-primary)' }}
            >
              Cardápio
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${slug}/categoria/${cat.id}`}
                  className="relative rounded-2xl overflow-hidden h-28 flex items-end"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {cat.image_url && (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }}
                  />
                  <span className="relative z-10 px-3 pb-3 font-bold text-white text-sm leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Estado vazio */}
        {featured.length === 0 && cats.length === 0 && (
          <div className="mt-20 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white/60 text-lg font-medium">{restaurant.name}</p>
            <p className="text-white/30 text-sm mt-2">Cardápio sendo configurado...</p>
          </div>
        )}
      </div>

      {/* Rodapé do cardápio */}
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
