'use client'

import { useRouter } from 'next/navigation'

type Props = {
  currentSort: string
  slug: string
  id: string
}

export function CategorySortClient({ currentSort, slug, id }: Props) {
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <span className="text-white/40 text-sm self-center mr-1">Ordenar:</span>
      {[
        { value: 'maior', label: 'Maior preço' },
        { value: 'menor', label: 'Menor preço' },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => router.push(`/${slug}/categoria/${id}?ordem=${opt.value}`)}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
          style={{
            background: currentSort === opt.value ? 'var(--menu-primary)' : 'rgba(255,255,255,0.08)',
            color: currentSort === opt.value ? 'white' : 'rgba(255,255,255,0.6)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
