export type Tier = 'free' | 'premium'

export interface UserTier {
  userId: string
  tier: Tier
}

export function getUserTier(user: { tier?: string } | null | undefined): Tier {
  if (!user?.tier) return 'free'
  return user.tier === 'premium' ? 'premium' : 'free'
}

export function isPremium(user: { tier?: string } | null | undefined): boolean {
  return getUserTier(user) === 'premium'
}

export function getTierLabel(tier: Tier): string {
  return tier === 'premium' ? 'PRO' : 'Free'
}

export function getTierColor(tier: Tier): string {
  return tier === 'premium' ? '#00E5FF' : '#6B7280'
}
