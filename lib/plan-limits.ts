export type Plan = 'free' | 'basic' | 'pro'

export interface PlanLimits {
  maxProducts: number | null        // null = ilimitado
  maxCategories: number | null
  maxOptionGroupsPerProduct: number | null
  maxTeamMembers: number | null     // total incluindo dono
  whatsappEnabled: boolean
  analyticsEnabled: boolean
  singleDevice: boolean
}

const FREE_LIMITS: PlanLimits = {
  maxProducts: 16,
  maxCategories: 4,
  maxOptionGroupsPerProduct: 1,
  maxTeamMembers: 4,
  whatsappEnabled: false,
  analyticsEnabled: false,
  singleDevice: true,
}

const BASIC_LIMITS: PlanLimits = {
  maxProducts: null,
  maxCategories: null,
  maxOptionGroupsPerProduct: null,
  maxTeamMembers: null,
  whatsappEnabled: true,
  analyticsEnabled: false,
  singleDevice: false,
}

const PRO_LIMITS: PlanLimits = {
  ...BASIC_LIMITS,
  analyticsEnabled: true,
}

export function isInTrial(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

export function getEffectiveLimits(plan: Plan, trialEndsAt: string | null | undefined): PlanLimits {
  if (isInTrial(trialEndsAt)) return PRO_LIMITS
  if (plan === 'free') return FREE_LIMITS
  if (plan === 'pro') return PRO_LIMITS
  return BASIC_LIMITS
}

export function trialDaysLeft(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
