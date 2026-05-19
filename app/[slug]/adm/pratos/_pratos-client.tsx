'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Loader2, Star, Search } from 'lucide-react'
import { ImageCropPicker, type ImageCropPickerHandle } from '../_components/image-crop-picker'

type Category = { id: string; name: string }
type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_featured: boolean
  is_available: boolean
  category_id: string | null
}

type Form = {
  name: string
  description: string
  price: string
  category_id: string
  is_featured: boolean
  is_available: boolean
}

const EMPTY_FORM: Form = {
  name: '', description: '', price: '', category_id: '', is_featured: false, is_available: true,
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PratosClient({
  restaurantId,
  initialProducts,
  categories,
}: {
  restaurantId: string
  initialProducts: Product[]
  categories: Category[]
}) {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [pickerKey, setPickerKey] = useState(0)
  const cropPickerRef = useRef<ImageCropPickerHandle>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErro('')
    setPickerKey((k) => k + 1)
    setModal('create')
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      category_id: p.category_id ?? '',
      is_featured: p.is_featured,
      is_available: p.is_available,
    })
    setErro('')
    setPickerKey((k) => k + 1)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setErro('')
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${restaurantId}/products/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('restaurant-images')
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.name.trim()) { setErro('Nome obrigatório.'); return }
    const price = parseFloat(form.price.replace(',', '.'))
    if (isNaN(price) || price <= 0) { setErro('Preço inválido.'); return }

    setLoading(true)
    setErro('')

    try {
      let imageUrl = editing?.image_url ?? null
      if (cropPickerRef.current?.hasNewImage()) {
        const cropped = await cropPickerRef.current.getCroppedFile()
        if (cropped) imageUrl = await uploadImage(cropped)
      }

      const payload = {
        restaurant_id: restaurantId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        image_url: imageUrl,
        category_id: form.category_id || null,
        is_featured: form.is_featured,
        is_available: form.is_available,
      }

      if (modal === 'edit' && editing) {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single()
        if (error) throw error
        setProducts((prev) => prev.map((p) => p.id === editing.id ? data as Product : p))
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setProducts((prev) => [data as Product, ...prev])
      }

      closeModal()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir "${product.name}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== product.id))
  }

  async function toggleFeatured(product: Product) {
    const next = !product.is_featured
    const { error } = await supabase
      .from('products')
      .update({ is_featured: next })
      .eq('id', product.id)
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_featured: next } : p)
      )
    }
  }

  async function toggleAvailable(product: Product) {
    const next = !product.is_available
    const { error } = await supabase
      .from('products')
      .update({ is_available: next })
      .eq('id', product.id)
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_available: next } : p)
      )
    }
  }

  const filtered = products.filter((p) => {
    const matchCat = !filterCat || p.category_id === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const getCategoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pratos / Bebidas</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all"
          style={{ background: 'var(--adm-primary)' }}
        >
          <Plus className="w-4 h-4" /> Novo item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-400 text-sm">Nenhum item encontrado.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-bold" style={{ color: 'var(--adm-primary)' }}>
            + Adicionar primeiro item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3">
              {/* Imagem */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{product.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-black" style={{ color: 'var(--adm-primary)' }}>{formatPrice(product.price)}</span>
                      {getCategoryName(product.category_id) && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {getCategoryName(product.category_id)}
                        </span>
                      )}
                      {!product.is_available && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Indisponível</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      product.is_featured
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-yellow-50'
                    }`}
                    title="Exibir nos destaques"
                  >
                    <Star className={`w-3.5 h-3.5 ${product.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    {product.is_featured ? 'Destaque' : 'Destaque'}
                  </button>

                  <button
                    onClick={() => toggleAvailable(product)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      product.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {product.is_available ? 'Disponível' : 'Pausado'}
                  </button>

                  <button
                    onClick={() => openEdit(product)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>

                  <button
                    onClick={() => handleDelete(product)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                {modal === 'create' ? 'Novo item' : 'Editar item'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

              {/* Upload de imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
                <ImageCropPicker
                  key={pickerKey}
                  ref={cropPickerRef}
                  initialUrl={modal === 'edit' ? (editing?.image_url ?? null) : null}
                />
              </div>

              <Field label="Nome *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ex: X-Burguer" />
              <Field label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Ex: Pão, carne, queijo, alface..." textarea />
              <Field label="Preço (R$) *" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="Ex: 29.90" type="number" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <Toggle
                  label="Disponível"
                  checked={form.is_available}
                  onChange={(v) => setForm({ ...form, is_available: v })}
                />
                <Toggle
                  label="Exibir nos destaques"
                  checked={form.is_featured}
                  onChange={(v) => setForm({ ...form, is_featured: v })}
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{erro}</p>
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-3.5 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                style={{ background: 'var(--adm-primary)' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Salvando...' : modal === 'create' ? 'Criar item' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', textarea = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  textarea?: boolean
}) {
  const cls = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)] resize-none'
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-colors"
      style={checked ? {
        borderColor: 'var(--adm-primary)',
        background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
        color: 'var(--adm-primary)',
      } : { borderColor: '#e5e7eb', background: 'white', color: '#6b7280' }}
    >
      <div
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
        style={checked
          ? { borderColor: 'var(--adm-primary)', background: 'var(--adm-primary)' }
          : { borderColor: '#d1d5db', background: 'transparent' }}
      >
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      {label}
    </button>
  )
}
