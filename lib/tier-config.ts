import type { Tier } from './tier'

export interface FeatureConfig {
  free: {
    usernameScan: { maxResults: number; showDetails: boolean }
    instagram: { mode: 'public'; maxPosts: number; showComments: boolean }
    facebook: { mode: 'public'; showFriends: boolean }
    tiktok: { mode: 'public'; showComments: boolean }
    radar: { mode: 'basic' }
    darkweb: boolean
    advanced: boolean
  }
  premium: {
    usernameScan: { maxResults: number; showDetails: boolean }
    instagram: { mode: 'both'; maxPosts: number; showComments: boolean; showTopLikers: boolean }
    facebook: { mode: 'both'; showFriends: boolean; showLikes: boolean }
    tiktok: { mode: 'both'; showComments: boolean; showTopVideos: boolean }
    radar: { mode: 'monitor'; alerts: boolean }
    darkweb: boolean
    advanced: boolean
  }
}

export const TIER_FEATURES: FeatureConfig = {
  free: {
    usernameScan: { maxResults: 5, showDetails: false },
    instagram: { mode: 'public', maxPosts: 12, showComments: false },
    facebook: { mode: 'public', showFriends: false },
    tiktok: { mode: 'public', showComments: false },
    radar: { mode: 'basic' },
    darkweb: false,
    advanced: false,
  },
  premium: {
    usernameScan: { maxResults: 50, showDetails: true },
    instagram: { mode: 'both', maxPosts: 100, showComments: true, showTopLikers: true },
    facebook: { mode: 'both', showFriends: true, showLikes: true },
    tiktok: { mode: 'both', showComments: true, showTopVideos: true },
    radar: { mode: 'monitor', alerts: true },
    darkweb: true,
    advanced: true,
  },
}

export function getFeatureConfig(tier: Tier): FeatureConfig['free'] | FeatureConfig['premium'] {
  return TIER_FEATURES[tier]
}

const PREMIUM_FEATURES = new Set([
  'darkweb',
  'advanced',
  'radar.monitor',
  'radar.alerts',
  'instagram.topLikers',
  'instagram.comments',
  'instagram.extended',
  'facebook.friends',
  'facebook.likes',
  'facebook.extended',
  'tiktok.comments',
  'tiktok.topVideos',
  'tiktok.extended',
  'usernameScan.extended',
  'usernameScan.details',
])

export function canAccessFeature(tier: Tier, feature: string): boolean {
  if (tier === 'premium') return true
  return !PREMIUM_FEATURES.has(feature)
}
