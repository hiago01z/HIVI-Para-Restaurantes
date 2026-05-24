'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Loader2, Star, Search, ListPlus, ChevronDown, ChevronUp } from 'lucide-react'
import { ImageCropPicker, type ImageCropPickerHandle } from '../_components/image-crop-picker'
import { type PlanLimits, isInTrial, trialDaysLeft } from '@/lib/plan-limits'
import { formatCurrency, type SupportedCurrency } from '@/lib/currency'

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

// ── Adicionais types ─────────────────────────────────────────
type OptionItem = {
  id: string
  name: string
  price_addition: number
  is_available: boolean
  sort_order: number
}

type OptionGroup = {
  id: string
  name: string
  description: string | null
  min_selections: number
  max_selections: number
  sort_order: number
  items: OptionItem[]
}

type Form = {
  name: string
  description: string
  price: string
  category_id: string
  is_featured: boolean
  is_available: boolean
}

type GroupForm = { name: string; description: string; min_selections: string; max_selections: string }
type ItemForm  = { name: string; price_addition: string }

const EMPTY_FORM: Form = {
  name: '', description: '', price: '', category_id: '', is_featured: false, is_available: true,
}

export function PratosClient({
  restaurantId,
  initialProducts,
  categories,
  limits,
  plan,
  trialEndsAt,
  currency = 'BRL',
}: {
  restaurantId: string
  initialProducts: Product[]
  categories: Category[]
  limits?: PlanLimits
  plan?: string
  trialEndsAt?: string | null
  currency?: SupportedCurrency
}) {
  const formatPrice = (v: number) => formatCurrency(v, currency)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // Plan limits
  const inTrial = isInTrial(trialEndsAt)
  const daysLeft = trialDaysLeft(trialEndsAt)
  const atProductLimit = !inTrial && plan === 'free' && limits?.maxProducts !== null && products.length >= (limits?.maxProducts ?? Infinity)
  const canAddProduct = !atProductLimit
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [pickerKey, setPickerKey] = useState(0)
  const cropPickerRef = useRef<ImageCropPickerHandle>(null)

  // ── Adicionais (options management) ─────────────────────────
  const [optsProductId, setOptsProductId] = useState<string | null>(null)
  const optsProduct = products.find((p) => p.id === optsProductId) ?? null

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
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } else {
      setDeleteError('Erro ao excluir o item. Tente novamente.')
      setTimeout(() => setDeleteError(''), 4000)
    }
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
          onClick={canAddProduct ? openCreate : undefined}
          disabled={!canAddProduct}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
        >
          <Plus className="w-4 h-4" /> Novo item
        </button>
      </div>

      {/* Banner trial — exibe apenas para free e basic (pro já é o plano completo) */}
      {inTrial && plan !== 'pro' && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          Periodo experimental: {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'} com tudo do Pro
        </div>
      )}

      {/* Banner limite gratuito */}
      {atProductLimit && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          Limite de {limits?.maxProducts} pratos atingido.{' '}
          <a href="/conta" className="font-bold underline hover:text-orange-900">
            Assine um plano
          </a>{' '}
          para pratos ilimitados.
        </div>
      )}

      {/* Erro de exclusão */}
      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      )}

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
                      {!product.is_available && !atProductLimit && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Indisponível</span>
                      )}
                      {!product.is_available && atProductLimit && (limits?.maxProducts !== null) && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Bloqueado pelo plano</span>
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
                    onClick={() => setOptsProductId(product.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
                  >
                    <ListPlus className="w-3.5 h-3.5" /> Adicionais
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

      {/* Modal Adicionais */}
      {optsProductId && optsProduct && (
        <OptionsManageModal
          product={optsProduct}
          restaurantId={restaurantId}
          onClose={() => setOptsProductId(null)}
          maxOptionGroups={(!inTrial && plan === 'free') ? (limits?.maxOptionGroupsPerProduct ?? null) : null}
          currency={currency}
        />
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
                className="w-full py-3.5 disabled:opacity-50 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
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

// ── OptionsManageModal ────────────────────────────────────────────────────────

const EMPTY_GROUP_FORM: GroupForm = { name: '', description: '', min_selections: '0', max_selections: '1' }
const EMPTY_ITEM_FORM:  ItemForm  = { name: '', price_addition: '0' }

function OptionsManageModal({
  product,
  restaurantId,
  onClose,
  maxOptionGroups,
  currency,
}: {
  product: Product
  restaurantId: string
  onClose: () => void
  maxOptionGroups?: number | null
  currency?: SupportedCurrency
}) {
  const supabase = createClient()
  const formatPrice = (v: number) => formatCurrency(v, currency)
  const [groups, setGroups] = useState<OptionGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // Create group
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupForm, setGroupForm] = useState<GroupForm>(EMPTY_GROUP_FORM)
  const [savingGroup, setSavingGroup] = useState(false)
  const [groupError, setGroupError] = useState('')

  // Edit group
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupForm, setEditGroupForm] = useState<GroupForm>(EMPTY_GROUP_FORM)
  const [savingEditGroup, setSavingEditGroup] = useState(false)
  const [editGroupError, setEditGroupError] = useState('')

  // Create item
  const [showItemForm, setShowItemForm] = useState<Record<string, boolean>>({})
  const [itemForms, setItemForms] = useState<Record<string, ItemForm>>({})
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [itemError, setItemError] = useState<Record<string, string>>({})

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemForm, setEditItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM)
  const [savingEditItem, setSavingEditItem] = useState(false)
  const [editItemError, setEditItemError] = useState('')

  void restaurantId

  // Fetch groups + items on mount
  useEffect(() => {
    supabase
      .from('product_option_groups')
      .select('id, name, description, min_selections, max_selections, sort_order, product_option_items(id, name, price_addition, is_available, sort_order)')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setGroups(data.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            min_selections: g.min_selections,
            max_selections: g.max_selections,
            sort_order: g.sort_order,
            items: ((g.product_option_items as OptionItem[] | null) ?? [])
              .sort((a, b) => a.sort_order - b.sort_order),
          })))
        }
        setLoadingGroups(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  // ── Group CRUD ───────────────────────────────────────────────
  async function handleSaveGroup() {
    if (!groupForm.name.trim()) { setGroupError('Nome do grupo é obrigatório.'); return }
    const min = parseInt(groupForm.min_selections) || 0
    const max = parseInt(groupForm.max_selections) || 1
    if (max < 1) { setGroupError('Máx. deve ser ≥ 1.'); return }
    if (min > max) { setGroupError('Mín. não pode ser maior que Máx.'); return }
    setSavingGroup(true); setGroupError('')
    const { data, error } = await supabase
      .from('product_option_groups')
      .insert({ product_id: product.id, name: groupForm.name.trim(), description: groupForm.description.trim() || null, min_selections: min, max_selections: max, sort_order: groups.length })
      .select().single()
    setSavingGroup(false)
    if (error || !data) { setGroupError('Erro ao salvar. Tente novamente.'); return }
    const newGroup: OptionGroup = { id: data.id, name: data.name, description: data.description, min_selections: data.min_selections, max_selections: data.max_selections, sort_order: data.sort_order, items: [] }
    setGroups((prev) => [...prev, newGroup])
    setGroupForm(EMPTY_GROUP_FORM); setShowGroupForm(false); setExpandedGroup(newGroup.id)
  }

  function openEditGroup(group: OptionGroup) {
    setEditingGroupId(group.id)
    setEditGroupForm({ name: group.name, description: group.description ?? '', min_selections: String(group.min_selections), max_selections: String(group.max_selections) })
    setEditGroupError('')
    // Ensure group is expanded
    setExpandedGroup(group.id)
  }

  async function handleUpdateGroup(groupId: string) {
    if (!editGroupForm.name.trim()) { setEditGroupError('Nome obrigatório.'); return }
    const min = parseInt(editGroupForm.min_selections) || 0
    const max = parseInt(editGroupForm.max_selections) || 1
    if (min > max) { setEditGroupError('Mín. não pode ser maior que Máx.'); return }
    setSavingEditGroup(true); setEditGroupError('')
    const { error } = await supabase
      .from('product_option_groups')
      .update({ name: editGroupForm.name.trim(), description: editGroupForm.description.trim() || null, min_selections: min, max_selections: max })
      .eq('id', groupId)
    setSavingEditGroup(false)
    if (error) { setEditGroupError('Erro ao salvar.'); return }
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: editGroupForm.name.trim(), description: editGroupForm.description.trim() || null, min_selections: min, max_selections: max } : g))
    setEditingGroupId(null)
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Excluir este grupo e todos os seus itens?')) return
    const { error } = await supabase.from('product_option_groups').delete().eq('id', groupId)
    if (!error) setGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  // ── Item CRUD ────────────────────────────────────────────────
  async function handleSaveItem(groupId: string) {
    const form = itemForms[groupId] ?? EMPTY_ITEM_FORM
    if (!form.name.trim()) { setItemError((prev) => ({ ...prev, [groupId]: 'Nome obrigatório.' })); return }
    const priceAdd = parseFloat(form.price_addition.replace(',', '.')) || 0
    setSavingItem(groupId); setItemError((prev) => ({ ...prev, [groupId]: '' }))
    const group = groups.find((g) => g.id === groupId)
    const { data, error } = await supabase
      .from('product_option_items')
      .insert({ group_id: groupId, name: form.name.trim(), price_addition: priceAdd, sort_order: group?.items.length ?? 0 })
      .select().single()
    setSavingItem(null)
    if (error || !data) { setItemError((prev) => ({ ...prev, [groupId]: 'Erro ao salvar.' })); return }
    const newItem: OptionItem = { id: data.id, name: data.name, price_addition: data.price_addition, is_available: data.is_available, sort_order: data.sort_order }
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, items: [...g.items, newItem] } : g))
    setItemForms((prev) => ({ ...prev, [groupId]: EMPTY_ITEM_FORM })); setShowItemForm((prev) => ({ ...prev, [groupId]: false }))
  }

  function openEditItem(item: OptionItem) {
    setEditingItemId(item.id)
    setEditItemForm({ name: item.name, price_addition: String(item.price_addition) })
    setEditItemError('')
  }

  async function handleUpdateItem(groupId: string, itemId: string) {
    if (!editItemForm.name.trim()) { setEditItemError('Nome obrigatório.'); return }
    const priceAdd = parseFloat(editItemForm.price_addition.replace(',', '.')) || 0
    setSavingEditItem(true); setEditItemError('')
    const { error } = await supabase
      .from('product_option_items')
      .update({ name: editItemForm.name.trim(), price_addition: priceAdd })
      .eq('id', itemId)
    setSavingEditItem(false)
    if (error) { setEditItemError('Erro ao salvar.'); return }
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, items: g.items.map((i) => i.id === itemId ? { ...i, name: editItemForm.name.trim(), price_addition: priceAdd } : i) } : g))
    setEditingItemId(null)
  }

  async function handleDeleteItem(groupId: string, itemId: string) {
    const { error } = await supabase.from('product_option_items').delete().eq('id', itemId)
    if (!error) setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g))
  }

  async function handleToggleItemAvailable(groupId: string, item: OptionItem) {
    const next = !item.is_available
    const { error } = await supabase.from('product_option_items').update({ is_available: next }).eq('id', item.id)
    if (!error) setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, items: g.items.map((i) => i.id === item.id ? { ...i, is_available: next } : i) } : g))
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg tracking-tight">Adicionais</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loadingGroups ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {groups.length === 0 && !showGroupForm && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-gray-400 mb-4">Nenhum grupo de adicionais ainda.</p>
                </div>
              )}

              {/* Existing groups */}
              {groups.map((group) => {
                const isExpanded = expandedGroup === group.id
                const isEditing = editingGroupId === group.id
                const isRequired = group.min_selections > 0
                const labelType = group.max_selections === 1 ? 'Escolha 1' : `Até ${group.max_selections}`

                return (
                  <div key={group.id} className="border border-gray-200 rounded-2xl overflow-hidden">

                    {/* Group header — edit mode */}
                    {isEditing ? (
                      <div className="px-4 py-3 bg-blue-50 space-y-2.5">
                        <p className="text-xs font-bold text-blue-700 mb-1">Editando grupo</p>
                        <input
                          value={editGroupForm.name}
                          onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                          placeholder="Nome do grupo"
                          className={inputCls}
                        />
                        <input
                          value={editGroupForm.description}
                          onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                          placeholder="Descrição (opcional)"
                          className={inputCls}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mínimo</label>
                            <select value={editGroupForm.min_selections} onChange={(e) => setEditGroupForm({ ...editGroupForm, min_selections: e.target.value })} className={inputCls}>
                              {[0,1,2,3].map((n) => <option key={n} value={n}>{n === 0 ? '0 (opcional)' : n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Máximo</label>
                            <select value={editGroupForm.max_selections} onChange={(e) => setEditGroupForm({ ...editGroupForm, max_selections: e.target.value })} className={inputCls}>
                              {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n === 1 ? '1 (única)' : n}</option>)}
                            </select>
                          </div>
                        </div>
                        {editGroupError && <p className="text-xs text-red-500">{editGroupError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateGroup(group.id)} disabled={savingEditGroup}
                            className="flex-1 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50"
                            style={{ background: 'var(--adm-primary)' }}>
                            {savingEditGroup ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar grupo'}
                          </button>
                          <button onClick={() => setEditingGroupId(null)} className="px-3 py-2 text-sm rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Group header — view mode */
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <button onClick={() => setExpandedGroup(isExpanded ? null : group.id)} className="flex-1 flex items-center gap-2 text-left">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">
                              {group.name}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            <p className="text-xs text-gray-400">
                              {labelType} · {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>
                        <button onClick={() => openEditGroup(group)} className="ml-1 p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 transition-colors" title="Editar grupo">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteGroup(group.id)} className="ml-1 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Group items */}
                    {isExpanded && !isEditing && (
                      <div className="px-4 py-3 space-y-2">
                        {group.items.map((item) => {
                          const isEditingItem = editingItemId === item.id
                          if (isEditingItem) {
                            return (
                              <div key={item.id} className="rounded-xl bg-blue-50 p-2.5 space-y-2">
                                <input
                                  value={editItemForm.name}
                                  onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                                  placeholder="Nome da opção"
                                  className={inputCls}
                                />
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">+R$</span>
                                    <input type="number" min="0" step="0.01"
                                      value={editItemForm.price_addition}
                                      onChange={(e) => setEditItemForm({ ...editItemForm, price_addition: e.target.value })}
                                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none"
                                    />
                                  </div>
                                  <button onClick={() => handleUpdateItem(group.id, item.id)} disabled={savingEditItem}
                                    className="px-4 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50"
                                    style={{ background: 'var(--adm-primary)' }}>
                                    {savingEditItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                                  </button>
                                  <button onClick={() => setEditingItemId(null)} className="px-3 py-2 text-sm rounded-xl bg-gray-100 text-gray-500">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                {editItemError && <p className="text-xs text-red-500">{editItemError}</p>}
                              </div>
                            )
                          }

                          return (
                            <div key={item.id} className="flex items-center gap-2">
                              <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                              {item.price_addition > 0 && (
                                <span className="text-xs font-bold text-gray-500 flex-shrink-0">+{formatPrice(item.price_addition)}</span>
                              )}
                              <button
                                onClick={() => handleToggleItemAvailable(group.id, item)}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors flex-shrink-0 ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                              >
                                {item.is_available ? 'Ativo' : 'Pausado'}
                              </button>
                              <button onClick={() => openEditItem(item)} className="p-1 rounded text-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteItem(group.id, item.id)} className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })}

                        {/* Add item form */}
                        {showItemForm[group.id] ? (
                          <div className="pt-2 space-y-2 border-t border-gray-100">
                            <input
                              value={itemForms[group.id]?.name ?? ''}
                              onChange={(e) => setItemForms((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? EMPTY_ITEM_FORM), name: e.target.value } }))}
                              placeholder="Nome da opção (ex: Carne dupla)"
                              className={inputCls}
                            />
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">+R$</span>
                                <input type="number" min="0" step="0.01"
                                  value={itemForms[group.id]?.price_addition ?? '0'}
                                  onChange={(e) => setItemForms((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? EMPTY_ITEM_FORM), price_addition: e.target.value } }))}
                                  placeholder="0,00"
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none"
                                />
                              </div>
                              <button onClick={() => handleSaveItem(group.id)} disabled={savingItem === group.id}
                                className="px-4 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50"
                                style={{ background: 'var(--adm-primary)' }}>
                                {savingItem === group.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                              </button>
                              <button onClick={() => setShowItemForm((prev) => ({ ...prev, [group.id]: false }))} className="px-3 py-2 text-sm rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {itemError[group.id] && <p className="text-xs text-red-500">{itemError[group.id]}</p>}
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowItemForm((prev) => ({ ...prev, [group.id]: true }))}
                            className="w-full mt-1 py-2 text-xs font-bold border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
                          >
                            + Adicionar opção
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Aviso limite de grupos (plano free) */}
              {maxOptionGroups !== null && maxOptionGroups !== undefined && groups.length >= maxOptionGroups && !showGroupForm && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                  Limite de {maxOptionGroups} grupo de adicionais por produto no plano gratuito.{' '}
                  <a href="/conta" className="font-bold underline hover:text-orange-900">Assine um plano</a> para grupos ilimitados.
                </div>
              )}

              {/* Add group form */}
              {showGroupForm ? (
                <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 space-y-3 bg-blue-50/30">
                  <p className="text-sm font-bold text-gray-700">Novo grupo de opções</p>
                  <input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="Nome do grupo (ex: Proteína, Tamanho...)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--adm-primary)_30%,transparent)] focus:border-[color:var(--adm-primary)]"
                  />
                  <input
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    placeholder="Descrição (opcional)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mínimo de escolhas</label>
                      <select
                        value={groupForm.min_selections}
                        onChange={(e) => setGroupForm({ ...groupForm, min_selections: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none"
                      >
                        {[0,1,2,3].map((n) => <option key={n} value={n}>{n === 0 ? '0 (opcional)' : n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Máximo de escolhas</label>
                      <select
                        value={groupForm.max_selections}
                        onChange={(e) => setGroupForm({ ...groupForm, max_selections: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none"
                      >
                        {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n === 1 ? '1 (escolha única)' : n}</option>)}
                      </select>
                    </div>
                  </div>

                  {groupError && <p className="text-xs text-red-500">{groupError}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGroup}
                      disabled={savingGroup}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-50"
                      style={{ background: 'var(--adm-primary)' }}
                    >
                      {savingGroup ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar grupo'}
                    </button>
                    <button
                      onClick={() => { setShowGroupForm(false); setGroupForm(EMPTY_GROUP_FORM); setGroupError('') }}
                      className="px-4 py-2.5 text-sm rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (maxOptionGroups === null || maxOptionGroups === undefined || groups.length < maxOptionGroups) && (
                <button
                  onClick={() => setShowGroupForm(true)}
                  className="w-full py-3 text-sm font-bold border-2 border-dashed rounded-2xl transition-colors"
                  style={{ borderColor: 'var(--adm-primary)', color: 'var(--adm-primary)' }}
                >
                  <Plus className="w-4 h-4 inline mr-1.5" />
                  Novo grupo de adicionais
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

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
