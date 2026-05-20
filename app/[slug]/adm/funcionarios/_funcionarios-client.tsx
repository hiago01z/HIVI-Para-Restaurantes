'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Loader2, Users, Crown, ShieldCheck, User } from 'lucide-react'
import Image from 'next/image'

type Member = {
  id: string
  user_id: string
  role: string
  created_at: string
  email: string
  name: string | null
  avatar_url: string | null
}

type Props = {
  slug: string
  initialMembers: Member[]
}

const ROLE_OPTIONS = [
  { value: 'owner',   label: 'Dono',       icon: Crown,       color: 'text-orange-500 bg-orange-50' },
  { value: 'manager', label: 'Gerente',     icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  { value: 'staff',   label: 'Funcionário', icon: User,        color: 'text-gray-600 bg-gray-100' },
]

function getRoleConfig(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[2]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function FuncionariosClient({ slug, initialMembers }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')

  async function handleInvite() {
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const res = await fetch(`/api/adm/${slug}/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error ?? 'Erro ao convidar')
        return
      }

      if (data.invited) {
        setInviteSuccess(`Convite enviado para ${inviteEmail}! Eles receberão um e-mail para criar a conta.`)
      } else if (data.updated) {
        setInviteSuccess(`Cargo de ${inviteEmail} atualizado com sucesso.`)
      } else {
        setInviteSuccess(`${inviteEmail} adicionado à equipe!`)
      }

      // Recarregar lista
      const listRes = await fetch(`/api/adm/${slug}/funcionarios`)
      if (listRes.ok) {
        const listData = await listRes.json()
        setMembers(listData.members)
      }

      setInviteEmail('')
      setShowInvite(false)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Erro ao convidar. Tente novamente.')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    try {
      const res = await fetch(`/api/adm/${slug}/funcionarios`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
      } else {
        setRemoveError('Erro ao remover membro. Tente novamente.')
        setTimeout(() => setRemoveError(''), 4000)
      }
    } catch {
      setRemoveError('Erro de conexão. Tente novamente.')
      setTimeout(() => setRemoveError(''), 4000)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-400 mt-0.5">{members.length} {members.length === 1 ? 'membro' : 'membros'}</p>
        </div>
        <button
          onClick={() => { setShowInvite(!showInvite); setInviteError(''); setInviteSuccess('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
        >
          <UserPlus className="w-4 h-4" />
          Convidar
        </button>
      </div>

      {/* Erro ao remover membro */}
      {removeError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {removeError}
        </div>
      )}

      {/* Formulário de convite */}
      {showInvite && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Convidar novo membro</h2>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="funcionario@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cargo</label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setInviteRole(r.value as 'manager' | 'staff')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      inviteRole === r.value ? '' : 'border-gray-100 text-gray-500'
                    }`}
                    style={inviteRole === r.value ? {
                      borderColor: 'var(--adm-primary)',
                      color: 'var(--adm-primary)',
                      background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                    } : undefined}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {inviteRole === 'manager'
                  ? 'Gerentes podem acessar o painel e gerenciar pedidos, pratos e categorias.'
                  : 'Funcionários podem acessar o painel e gerenciar pedidos.'}
              </p>
            </div>
          </div>

          {inviteError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-3">{inviteError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
            >
              {inviteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {inviteLoading ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {inviteSuccess && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">
          {inviteSuccess}
        </div>
      )}

      {/* Lista de membros */}
      {members.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-100">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm">Nenhum membro na equipe ainda.</p>
          <p className="text-gray-300 text-xs mt-1">Clique em &ldquo;Convidar&rdquo; para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const rc = getRoleConfig(member.role)
            const Icon = rc.icon
            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
              >
                {/* Avatar */}
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name ?? member.email}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
                    style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
                  >
                    {(member.name ?? member.email).charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {member.name && (
                    <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  <p className="text-xs text-gray-300 mt-0.5">Desde {formatDate(member.created_at)}</p>
                </div>

                {/* Badge de cargo */}
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${rc.color}`}>
                  <Icon className="w-3 h-3" />
                  {rc.label}
                </span>

                {/* Remover (apenas non-owners) */}
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removingId === member.id}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Remover da equipe"
                  >
                    {removingId === member.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
