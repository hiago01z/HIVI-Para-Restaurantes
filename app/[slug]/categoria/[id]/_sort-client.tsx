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
      <span className="text-sm self-center mr-1" style={{ color: 'var(--menu-text-muted)' }}>Ordenar:</span>
      {[
        { value: 'maior', label: 'Maior preço' },
        { value: 'menor', label: 'Menor preço' },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => router.push(`/${slug}/categoria/${id}?ordem=${opt.value}`)}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
          style={{
            background: currentSort === opt.value ? 'var(--menu-primary)' : 'var(--menu-card)',
            color: currentSort === opt.value ? 'white' : 'var(--menu-text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
