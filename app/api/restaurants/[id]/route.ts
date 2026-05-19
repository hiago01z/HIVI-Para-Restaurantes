import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/restaurants/[id] — toggle is_active
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { is_active } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('restaurants')
      .update({ is_active })
      .eq('id', id)
      .eq('owner_id', user.id)  // garante que só o dono pode alterar
      .select('id, is_active')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ restaurant: data })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/restaurants/[id] — excluir restaurante
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })

    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
