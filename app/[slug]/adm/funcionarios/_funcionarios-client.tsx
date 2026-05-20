'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Loader2, Users, Crown, ShieldCheck, ChefHat, Bike, HandPlatter } from 'lucide-react'
import Image from 'next/image'

type Member = {
  id: string
  user_id: string
  role: string
  name: string | null        // nome definido pelo dono
  created_at: string
  email: string
  auth_name: string | null   // nome vindo do Supabase Auth (Google etc.)
  avatar_url: string | null
  has_adm_password: boolean
}

type Props = {
  slug: string
  initialMembers: Member[]
}

type InviteRole = 'manager' | 'cook' | 'waiter' | 'delivery'

const ROLE_OPTIONS = [
  {
    value: 'owner',
    label: 'Dono',
    icon: Crown,
    color: 'text-orange-500 bg-orange-50',
    desc: '',
  },
  {
    value: 'manager',
    label: 'Gerente',
    icon: ShieldCheck,
    color: 'text-blue-600 bg-blue-50',
    desc: 'Acesso completo — exceto pausar/excluir o cardápio.',
  },
  {
    value: 'cook',
    label: 'Cozinheiro',
    icon: ChefHat,
    color: 'text-purple-600 bg-purple-50',
    desc: 'Pedidos de mesa e entrega. Pode avançar status até "Pronto".',
  },
  {
    value: 'waiter',
    label: 'Garçom',
    icon: HandPlatter,
    color: 'text-green-600 bg-green-50',
    desc: 'Pedidos de mesa e leitura de QR Code. Pode confirmar pedidos.',
  },
  {
    value: 'delivery',
    label: 'Entregador',
    icon: Bike,
    color: 'text-yellow-600 bg-yellow-50',
    desc: 'Apenas pedidos de entrega. Pode marcar como saiu/entregue.',
  },
]

function getRoleConfig(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[ROLE_OPTIONS.length - 1]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function FuncionariosClient({ slug, initialMembers }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('delivery')
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
        body: JSON.stringify({ email: inviteEmail, name: inviteName || null, role: inviteRole }),
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
      setInviteName('')
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

  const inviteRoleOptions = ROLE_OPTIONS.filter((r) => r.value !== 'owner') as typeof ROLE_OPTIONS

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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome de exibição</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ex: Lucas Silva"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[color:var(--adm-primary)]"
              />
              <p className="text-xs text-gray-400 mt-1">Aparece em &ldquo;Alterado por&rdquo; nas atualizações de status.</p>
            </div>
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
              <div className="grid grid-cols-2 gap-2">
                {inviteRoleOptions.map((r) => {
                  const Icon = r.icon
                  const selected = inviteRole === r.value
                  return (
                    <button
                      key={r.value}
                      onClick={() => setInviteRole(r.value as InviteRole)}
                      className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left`}
                      style={selected ? {
                        borderColor: 'var(--adm-primary)',
                        color: 'var(--adm-primary)',
                        background: 'color-mix(in srgb, var(--adm-primary) 8%, white)',
                      } : { borderColor: '#f3f4f6', color: '#6b7280' }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {r.label}
                    </button>
                  )
                })}
              </div>
              {/* Descrição do cargo selecionado */}
              {(() => {
                const rc = inviteRoleOptions.find((r) => r.value === inviteRole)
                return rc?.desc ? (
                  <p className="text-xs text-gray-400 mt-2">{rc.desc}</p>
                ) : null
              })()}
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
            // Prioridade: nome definido pelo dono → nome do auth → email
            const displayName = member.name ?? member.auth_name ?? member.email

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
              >
                {/* Avatar */}
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={displayName}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
                    style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-300">Desde {formatDate(member.created_at)}</p>
                    {member.has_adm_password ? (
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">senha ✓</span>
                    ) : (
                      <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">sem senha</span>
                    )}
                  </div>
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
