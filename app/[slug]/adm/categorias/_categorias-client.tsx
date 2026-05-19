'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { ImageCropPicker, type ImageCropPickerHandle } from '../_components/image-crop-picker'

type Category = {
  id: string
  name: string
  image_url: string | null
  display_order: number
}

export function CategoriasClient({
  restaurantId,
  initialCategories,
}: {
  restaurantId: string
  initialCategories: Category[]
}) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [pickerKey, setPickerKey] = useState(0)
  const cropPickerRef = useRef<ImageCropPickerHandle>(null)

  function openCreate() {
    setEditing(null)
    setName('')
    setErro('')
    setPickerKey((k) => k + 1)
    setModal('create')
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setName(cat.name)
    setErro('')
    setPickerKey((k) => k + 1)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setErro('')
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${restaurantId}/categories/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('restaurant-images')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(`Falha no upload da imagem: ${error.message}`)
    const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!name.trim()) { setErro('Nome obrigatório.'); return }
    setLoading(true)
    setErro('')

    try {
      let imageUrl = editing?.image_url ?? null
      if (cropPickerRef.current?.hasNewImage()) {
        const cropped = await cropPickerRef.current.getCroppedFile()
        if (cropped) imageUrl = await uploadImage(cropped)
      }

      if (modal === 'edit' && editing) {
        const { data, error } = await supabase
          .from('categories')
          .update({ name: name.trim(), image_url: imageUrl })
          .eq('id', editing.id)
          .select()
          .single()
        if (error) throw error
        setCategories((prev) =>
          prev.map((c) => c.id === editing.id ? data as Category : c)
        )
      } else {
        const nextOrder = categories.length > 0
          ? Math.max(...categories.map((c) => c.display_order)) + 1
          : 0
        const { data, error } = await supabase
          .from('categories')
          .insert({
            restaurant_id: restaurantId,
            name: name.trim(),
            image_url: imageUrl,
            display_order: nextOrder,
          })
          .select()
          .single()
        if (error) throw error
        setCategories((prev) => [...prev, data as Category])
      }

      closeModal()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Excluir "${cat.name}"? Os pratos dessa categoria ficarão sem categoria.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    }
  }

  async function moveCategory(index: number, direction: 'up' | 'down') {
    const next = [...categories]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return

    // Swap no array local
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]

    // Reatribuir display_order pelo índice
    const updated = next.map((c, i) => ({ ...c, display_order: i }))
    setCategories(updated)

    // Persiste no banco em paralelo
    await Promise.all(
      updated.map((c) =>
        supabase.from('categories').update({ display_order: c.display_order }).eq('id', c.id)
      )
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categorias</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all"
          style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
        >
          <Plus className="w-4 h-4" /> Nova categoria
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-5">
        A ordem aqui define a ordem no cardápio público. Use as setas para reordenar.
      </p>

      {/* Lista */}
      {categories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-400 text-sm">Nenhuma categoria cadastrada.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-bold" style={{ color: 'var(--adm-primary)' }}>
            + Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              {/* Imagem */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                {cat.image_url ? (
                  <Image src={cat.image_url} alt={cat.name} fill sizes="56px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">📂</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    #{idx + 1}
                  </span>
                  <p className="font-bold text-gray-900 text-sm truncate">{cat.name}</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveCategory(idx, 'up')}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCategory(idx, 'down')}
                  disabled={idx === categories.length - 1}
                  className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                {modal === 'create' ? 'Nova categoria' : 'Editar categoria'}
              </h2>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Upload imagem */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagem</label>
              <ImageCropPicker
                key={pickerKey}
                ref={cropPickerRef}
                initialUrl={modal === 'edit' ? (editing?.image_url ?? null) : null}
              />
            </div>

            {/* Nome */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Entradas, Bebidas..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-600 text-sm">{erro}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3.5 disabled:opacity-50 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Salvando...' : modal === 'create' ? 'Criar categoria' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
