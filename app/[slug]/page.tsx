import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram } from 'lucide-react'
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
        <Image
          src={cat.image_url}
          alt={cat.name}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />
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
        className="relative z-10 px-3 pb-3 text-xl leading-snug w-full block"
        style={{
          fontFamily: 'var(--label-font)',
          color: 'var(--label-color)',
          textShadow: 'var(--label-text-shadow)',
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
    .select('id, name, slug, logo_url, is_active, instagram_url, whatsapp_number, address, address_url')
    .eq('slug', slug)
    .single()

  // is_active === null → cardápio novo, trata como ativo (null = não configurado ainda)
  // is_active === false → cardápio pausado pelo dono
  if (!restaurant || restaurant.is_active === false) notFound()

  const [{ data: categories }, { data: featuredProducts }, { data: allProducts }, { data: themeData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, image_url, display_order')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, product_option_groups(id)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_featured', true)
      .eq('is_available', true),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, category_id')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true),
    supabase
      .from('restaurant_themes')
      .select('banner_url')
      .eq('restaurant_id', restaurant.id)
      .single(),
  ])

  const cats = categories ?? []
  // Compute hasOptions for featured products
  type RawFeatured = NonNullable<typeof featuredProducts>[number]
  const featured = (featuredProducts ?? []).map((p: RawFeatured) => {
    const { product_option_groups, ...rest } = p as RawFeatured & { product_option_groups?: { id: string }[] }
    return { ...rest, hasOptions: (product_option_groups ?? []).length > 0 }
  })
  const products = allProducts ?? []
  const bannerUrl = themeData?.banner_url ?? null

  return (
    <div className="min-h-screen pb-24">

      <MenuHeaderClient
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        categories={cats}
        allProducts={products}
      />

      {/* Espaço do header fixo */}
      <div className="h-14" />

      {/* Banner do restaurante */}
      {bannerUrl && (
        <div className="relative w-full" style={{ height: '180px' }}>
          <Image
            src={bannerUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, var(--menu-bg) 100%)' }}
          />
        </div>
      )}

      <div className="px-4">

        {/* Destaques — carrossel grande */}
        {featured.length > 0 && (
          <section className="mt-3 mb-2">
            <FeaturedCarousel products={featured} slug={slug} />
          </section>
        )}

        {/* Categorias — padrão 2 pequenos + 1 grande */}
        {cats.length > 0 && (
          <section className="mb-8">
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

      {/* ── Rodapé ── */}
      <footer className="px-5 pt-10 pb-8 mt-6" style={{ borderTop: '1px solid rgba(128,128,128,0.15)' }}>

        {/* Identidade do restaurante */}
        <div className="flex flex-col items-center mb-6">
          {restaurant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-14 w-auto object-contain mb-3 max-w-[160px]"
            />
          ) : (
            <p
              className="font-bold text-base tracking-tight mb-3"
              style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font)' }}
            >
              {restaurant.name}
            </p>
          )}
        </div>

        {/* Links sociais */}
        {(restaurant.instagram_url || restaurant.whatsapp_number) && (
          <div className="flex justify-center gap-2 mb-8">
            {restaurant.instagram_url && (
              <a
                href={restaurant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-opacity opacity-70 hover:opacity-100"
                style={{
                  border: '1px solid rgba(128,128,128,0.3)',
                  color: 'var(--menu-text)',
                }}
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
            {restaurant.whatsapp_number && (
              <a
                href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-opacity opacity-70 hover:opacity-100"
                style={{
                  border: '1px solid rgba(128,128,128,0.3)',
                  color: 'var(--menu-text)',
                }}
              >
                {/* WhatsApp icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Endereço */}
        {restaurant.address && (
          <div className="flex justify-center mb-6">
            {restaurant.address_url ? (
              <a
                href={restaurant.address_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-center max-w-xs leading-relaxed opacity-70 flex items-start gap-1.5 hover:opacity-100 underline underline-offset-2 transition-opacity"
                style={{ color: 'var(--menu-text-muted)' }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {restaurant.address}
              </a>
            ) : (
              <p
                className="text-xs font-medium text-center max-w-xs leading-relaxed opacity-70 flex items-start gap-1.5"
                style={{ color: 'var(--menu-text-muted)' }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {restaurant.address}
              </p>
            )}
          </div>
        )}

        {/* Divisor + crédito HIVI */}
        <div
          className="pt-5 text-center"
          style={{ borderTop: '1px solid rgba(128,128,128,0.1)' }}
        >
          <p
            className="text-[0.6875rem] font-medium tracking-wide"
            style={{ color: 'var(--menu-text-muted)', opacity: 0.5 }}
          >
            &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Feito com{' '}
            <span className="font-bold tracking-widest">HIVI</span>
            &nbsp;·&nbsp; Todos os direitos reservados
          </p>
        </div>

      </footer>
    </div>
  )
}
