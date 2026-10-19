/**
 * Instagram Snapshot System
 * 
 * Creates and compares profile snapshots for change detection.
 */

import type { IGUser, IGMedia, IGComment } from './auth-fetch'
import { analyzeProfile, type AnalysisResult } from './analyzer'

// ==================== INTERFACES ====================

export interface ProfileSnapshot {
  id: string
  targetUsername: string
  timestamp: number
  duration: number // time taken to create snapshot (ms)
  
  profile: {
    fullName: string
    bio: string | null
    avatarUrl: string | null
    isVerified: boolean
    isPrivate: boolean
    isBusiness: boolean
    externalUrl: string | null
    publicEmail: string | null
    publicPhone: string | null
    city: string | null
  }
  
  stats: {
    followers: number
    following: number
    posts: number
  }
  
  followers: {
    username: string
    fullName: string
    avatarUrl: string | null
    isVerified: boolean
    isPrivate: boolean
    followedAt?: number
  }[]
  
  following: {
    username: string
    fullName: string
    avatarUrl: string | null
    isVerified: boolean
  }[]
  
  posts: {
    shortcode: string
    caption: string
    imageUrl: string | null
    likes: number
    comments: number
    timestamp: number
    isVideo: boolean
    location: string | null
  }[]
  
  analysis: AnalysisResult
}

export interface SnapshotDiff {
  previousId: string
  currentId: string
  targetUsername: string
  timestamp: number
  
  profileChanges: {
    field: string
    oldValue: string
    newValue: string
  }[]
  
  followersChanges: {
    added: { username: string; fullName: string; avatarUrl: string | null; isVerified: boolean }[]
    removed: { username: string; fullName: string }[]
    netChange: number
  }
  
  followingChanges: {
    added: { username: string; fullName: string }[]
    removed: { username: string; fullName: string }[]
    netChange: number
  }
  
  postsChanges: {
    added: { shortcode: string; caption: string; likes: number; comments: number }[]
    removed: { shortcode: string; caption: string }[]
  }
  
  engagementChanges: {
    totalLikesDiff: number
    totalCommentsDiff: number
    avgLikesDiff: number
    avgCommentsDiff: number
  }
  
  alerts: {
    type: string
    message: string
    severity: 'info' | 'warning' | 'critical'
    timestamp: number
  }[]
}

// ==================== STORAGE ====================

const SNAPSHOTS_KEY = 'shandon_ig_snapshots'

function getStoredSnapshots(): ProfileSnapshot[] {
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ProfileSnapshot[]
  } catch {
    return []
  }
}

function storeSnapshots(snapshots: ProfileSnapshot[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots))
  }
}

// ==================== SNAPSHOT CREATION ====================

/**
 * Create a snapshot from fetched data
 */
export function createSnapshot(
  targetUsername: string,
  profile: IGUser,
  followers: IGUser[],
  following: IGUser[],
  posts: IGMedia[],
  comments: Map<string, IGComment[]>,
  duration: number
): ProfileSnapshot {
  const analysis = analyzeProfile(profile, followers, following, posts, comments)

  const snapshot: ProfileSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetUsername,
    timestamp: Date.now(),
    duration,
    
    profile: {
      fullName: profile.full_name,
      bio: profile.biography || null,
      avatarUrl: profile.profile_pic_url_hd || profile.profile_pic_url || null,
      isVerified: profile.is_verified,
      isPrivate: profile.is_private,
      isBusiness: profile.is_business,
      externalUrl: profile.external_url || null,
      publicEmail: profile.public_email || null,
      publicPhone: profile.public_phone_number || null,
      city: profile.city_name || null,
    },
    
    stats: {
      followers: followers.length,
      following: following.length,
      posts: posts.length,
    },
    
    followers: followers.map(f => ({
      username: f.username,
      fullName: f.full_name,
      avatarUrl: f.profile_pic_url || null,
      isVerified: f.is_verified,
      isPrivate: f.is_private,
    })),
    
    following: following.map(f => ({
      username: f.username,
      fullName: f.full_name,
      avatarUrl: f.profile_pic_url || null,
      isVerified: f.is_verified,
    })),
    
    posts: posts.map(p => ({
      shortcode: p.shortcode,
      caption: p.caption?.text || '',
      imageUrl: p.image_versions2?.candidates?.[0]?.url || null,
      likes: p.like_count,
      comments: p.comment_count,
      timestamp: p.taken_at * 1000,
      isVideo: p.is_video,
      location: p.location?.name || null,
    })),
    
    analysis,
  }

  // Store snapshot
  const snapshots = getStoredSnapshots()
  snapshots.push(snapshot)
  storeSnapshots(snapshots)

  return snapshot
}

/**
 * Get all stored snapshots
 */
export function getAllSnapshots(): ProfileSnapshot[] {
  return getStoredSnapshots()
}

/**
 * Get snapshots for a specific target
 */
export function getSnapshotsForTarget(username: string): ProfileSnapshot[] {
  return getStoredSnapshots().filter(s => s.targetUsername === username)
}

/**
 * Get a specific snapshot by ID
 */
export function getSnapshotById(id: string): ProfileSnapshot | undefined {
  return getStoredSnapshots().find(s => s.id === id)
}

/**
 * Delete a snapshot
 */
export function deleteSnapshot(id: string): boolean {
  const snapshots = getStoredSnapshots()
  const filtered = snapshots.filter(s => s.id !== id)
  if (filtered.length === snapshots.length) return false
  storeSnapshots(filtered)
  return true
}

// ==================== COMPARISON ====================

/**
 * Compare two snapshots and detect changes
 */
export function compareSnapshots(
  previous: ProfileSnapshot,
  current: ProfileSnapshot
): SnapshotDiff {
  const alerts: SnapshotDiff['alerts'] = []

  // Profile changes
  const profileChanges: SnapshotDiff['profileChanges'] = []
  
  const fieldsToCheck: { key: string; label: string }[] = [
    { key: 'fullName', label: 'Nome' },
    { key: 'bio', label: 'Bio' },
    { key: 'avatarUrl', label: 'Foto' },
    { key: 'isVerified', label: 'Verificado' },
    { key: 'externalUrl', label: 'Website' },
    { key: 'publicEmail', label: 'Email' },
    { key: 'publicPhone', label: 'Telefone' },
    { key: 'city', label: 'Cidade' },
  ]

  for (const { key, label } of fieldsToCheck) {
    const oldVal = String(previous.profile[key as keyof typeof previous.profile] || '')
    const newVal = String(current.profile[key as keyof typeof current.profile] || '')
    
    if (oldVal !== newVal) {
      profileChanges.push({
        field: label,
        oldValue: oldVal || '(vazio)',
        newValue: newVal || '(vazio)',
      })
      
      alerts.push({
        type: 'profile_change',
        message: `${label} mudou: "${oldVal || '(vazio)'}" → "${newVal || '(vazio)'}"`,
        severity: key === 'bio' || key === 'avatarUrl' ? 'warning' : 'info',
        timestamp: current.timestamp,
      })
    }
  }

  // Followers changes
  const prevFollowerUsernames = new Set(previous.followers.map(f => f.username))
  const currFollowerUsernames = new Set(current.followers.map(f => f.username))

  const addedFollowers = current.followers.filter(f => !prevFollowerUsernames.has(f.username))
  const removedFollowers = previous.followers.filter(f => !currFollowerUsernames.has(f.username))

  if (addedFollowers.length > 0) {
    alerts.push({
      type: 'new_followers',
      message: `+${addedFollowers.length} novos seguidores`,
      severity: 'info',
      timestamp: current.timestamp,
    })
  }

  if (removedFollowers.length > 0) {
    alerts.push({
      type: 'lost_followers',
      message: `${removedFollowers.length} seguidores saíram`,
      severity: 'warning',
      timestamp: current.timestamp,
    })
  }

  // Following changes
  const prevFollowingUsernames = new Set(previous.following.map(f => f.username))
  const currFollowingUsernames = new Set(current.following.map(f => f.username))

  const addedFollowing = current.following.filter(f => !prevFollowingUsernames.has(f.username))
  const removedFollowing = previous.following.filter(f => !currFollowingUsernames.has(f.username))

  // Posts changes
  const prevPostShortcodes = new Set(previous.posts.map(p => p.shortcode))
  const currPostShortcodes = new Set(current.posts.map(p => p.shortcode))

  const addedPosts = current.posts.filter(p => !prevPostShortcodes.has(p.shortcode))
  const removedPosts = previous.posts.filter(p => !currPostShortcodes.has(p.shortcode))

  if (addedPosts.length > 0) {
    alerts.push({
      type: 'new_posts',
      message: `+${addedPosts.length} posts novos`,
      severity: 'info',
      timestamp: current.timestamp,
    })
  }

  if (removedPosts.length > 0) {
    alerts.push({
      type: 'removed_posts',
      message: `${removedPosts.length} posts foram arquivados/removidos`,
      severity: 'critical',
      timestamp: current.timestamp,
    })
  }

  // Engagement changes
  const prevTotalLikes = previous.posts.reduce((s, p) => s + p.likes, 0)
  const currTotalLikes = current.posts.reduce((s, p) => s + p.likes, 0)
  const prevTotalComments = previous.posts.reduce((s, p) => s + p.comments, 0)
  const currTotalComments = current.posts.reduce((s, p) => s + p.comments, 0)

  return {
    previousId: previous.id,
    currentId: current.id,
    targetUsername: current.targetUsername,
    timestamp: current.timestamp,
    
    profileChanges,
    
    followersChanges: {
      added: addedFollowers.map(f => ({
        username: f.username,
        fullName: f.fullName,
        avatarUrl: f.avatarUrl,
        isVerified: f.isVerified,
      })),
      removed: removedFollowers.map(f => ({
        username: f.username,
        fullName: f.fullName,
      })),
      netChange: addedFollowers.length - removedFollowers.length,
    },
    
    followingChanges: {
      added: addedFollowing.map(f => ({
        username: f.username,
        fullName: f.fullName,
      })),
      removed: removedFollowing.map(f => ({
        username: f.username,
        fullName: f.fullName,
      })),
      netChange: addedFollowing.length - removedFollowing.length,
    },
    
    postsChanges: {
      added: addedPosts.map(p => ({
        shortcode: p.shortcode,
        caption: p.caption.slice(0, 100),
        likes: p.likes,
        comments: p.comments,
      })),
      removed: removedPosts.map(p => ({
        shortcode: p.shortcode,
        caption: p.caption.slice(0, 100),
      })),
    },
    
    engagementChanges: {
      totalLikesDiff: currTotalLikes - prevTotalLikes,
      totalCommentsDiff: currTotalComments - prevTotalComments,
      avgLikesDiff: current.analysis.engagement.avgLikesPerPost - previous.analysis.engagement.avgLikesPerPost,
      avgCommentsDiff: current.analysis.engagement.avgCommentsPerPost - previous.analysis.engagement.avgCommentsPerPost,
    },
    
    alerts,
  }
}

/**
 * Generate human-readable summary of changes
 */
export function generateDiffSummary(diff: SnapshotDiff): string {
  const lines: string[] = []
  
  lines.push(`📊 Comparação: ${diff.targetUsername}`)
  lines.push(`📅 De: ${new Date(diff.timestamp).toLocaleString('pt-BR')}`)
  lines.push('')
  
  // Profile changes
  if (diff.profileChanges.length > 0) {
    lines.push('👤 Mudanças no Perfil:')
    for (const change of diff.profileChanges) {
      lines.push(`  • ${change.field}: "${change.oldValue}" → "${change.newValue}"`)
    }
    lines.push('')
  }
  
  // Followers
  lines.push(`👥 Seguidores: ${diff.followersChanges.netChange >= 0 ? '+' : ''}${diff.followersChanges.netChange}`)
  if (diff.followersChanges.added.length > 0) {
    lines.push('  Novos:')
    for (const f of diff.followersChanges.added.slice(0, 5)) {
      lines.push(`    + @${f.username} (${f.fullName})`)
    }
  }
  if (diff.followersChanges.removed.length > 0) {
    lines.push('  Saíram:')
    for (const f of diff.followersChanges.removed.slice(0, 5)) {
      lines.push(`    - @${f.username}`)
    }
  }
  lines.push('')
  
  // Posts
  lines.push(`📸 Posts: +${diff.postsChanges.added.length} / -${diff.postsChanges.removed.length}`)
  if (diff.postsChanges.removed.length > 0) {
    lines.push('  ⚠️ Posts removidos/arquivados:')
    for (const p of diff.postsChanges.removed) {
      lines.push(`    - "${p.caption}..."`)
    }
  }
  lines.push('')
  
  // Alerts
  if (diff.alerts.length > 0) {
    lines.push('🔔 Alertas:')
    for (const alert of diff.alerts) {
      const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'
      lines.push(`  ${icon} ${alert.message}`)
    }
  }
  
  return lines.join('\n')
}
