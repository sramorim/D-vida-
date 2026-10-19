/**
 * Instagram Analysis Engine
 * 
 * Analyzes fetched Instagram data to extract insights,
 * rankings, and patterns.
 */

import type { IGUser, IGMedia, IGComment } from './auth-fetch'

// ==================== INTERFACES ====================

export interface RankedUser {
  username: string
  fullName: string
  avatarUrl: string | null
  count: number
  isVerified: boolean
}

export interface RankedHashtag {
  tag: string
  count: number
}

export interface EngagementStats {
  totalLikes: number
  totalComments: number
  avgLikesPerPost: number
  avgCommentsPerPost: number
  engagementRate: number
  mostLikedPost: IGMedia | null
  mostCommentedPost: IGMedia | null
}

export interface ActivitySummary {
  postsCount: number
  followersCount: number
  followingCount: number
  avgPostsPerMonth: number
  mostActiveHour: number
  mostActiveDay: string
}

export interface AnalysisResult {
  profile: {
    username: string
    fullName: string
    bio: string | null
    avatarUrl: string | null
    isVerified: boolean
    isPrivate: boolean
    isBusiness: boolean
    followers: number
    following: number
    posts: number
  }
  
  engagement: EngagementStats
  
  rankings: {
    topCommenters: RankedUser[]
    topLikers: RankedUser[]
    topHashtags: RankedHashtag[]
    topMentioned: RankedUser[]
  }
  
  activity: ActivitySummary
  
  interactions: {
    mutualFollowers: { user1: string; user2: string }[]
    mostInteracted: RankedUser[]
  }
  
  anomalies: {
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }[]
}

// ==================== ANALYSIS FUNCTIONS ====================

/**
 * Analyze complete profile data
 */
export function analyzeProfile(
  profile: IGUser,
  followers: IGUser[],
  following: IGUser[],
  posts: IGMedia[],
  comments: Map<string, IGComment[]>
): AnalysisResult {
  return {
    profile: analyzeBasicProfile(profile, followers, following, posts),
    engagement: analyzeEngagement(posts, comments),
    rankings: analyzeRankings(posts, comments, followers),
    activity: analyzeActivity(posts),
    interactions: analyzeInteractions(followers, following),
    anomalies: detectAnomalies(posts, followers),
  }
}

function analyzeBasicProfile(
  profile: IGUser,
  followers: IGUser[],
  following: IGUser[],
  posts: IGMedia[]
) {
  return {
    username: profile.username,
    fullName: profile.full_name,
    bio: profile.biography || null,
    avatarUrl: profile.profile_pic_url_hd || profile.profile_pic_url || null,
    isVerified: profile.is_verified,
    isPrivate: profile.is_private,
    isBusiness: profile.is_business,
    followers: followers.length || profile.follower_count || 0,
    following: following.length || profile.following_count || 0,
    posts: posts.length || profile.media_count || 0,
  }
}

function analyzeEngagement(posts: IGMedia[], comments: Map<string, IGComment[]>): EngagementStats {
  if (posts.length === 0) {
    return {
      totalLikes: 0,
      totalComments: 0,
      avgLikesPerPost: 0,
      avgCommentsPerPost: 0,
      engagementRate: 0,
      mostLikedPost: null,
      mostCommentedPost: null,
    }
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0)

  const avgLikesPerPost = Math.round(totalLikes / posts.length)
  const avgCommentsPerPost = Math.round(totalComments / posts.length)

  // Engagement rate = (likes + comments) / posts count (simplified)
  const totalEngagement = totalLikes + totalComments
  const engagementRate = Math.round((totalEngagement / posts.length) * 100) / 100

  // Find most liked post
  const mostLikedPost = posts.reduce((max, p) => 
    (p.like_count > (max?.like_count || 0)) ? p : max, null as IGMedia | null)

  // Find most commented post
  const mostCommentedPost = posts.reduce((max, p) => 
    (p.comment_count > (max?.comment_count || 0)) ? p : max, null as IGMedia | null)

  return {
    totalLikes,
    totalComments,
    avgLikesPerPost,
    avgCommentsPerPost,
    engagementRate,
    mostLikedPost,
    mostCommentedPost,
  }
}

function analyzeRankings(
  posts: IGMedia[],
  comments: Map<string, IGComment[]>,
  followers: IGUser[]
): { topCommenters: RankedUser[]; topLikers: RankedUser[]; topHashtags: RankedHashtag[]; topMentioned: RankedUser[] } {
  // Top commenters
  const commenterCounts = new Map<string, { user: IGUser; count: number }>()
  for (const [, postComments] of comments) {
    for (const comment of postComments) {
      const existing = commenterCounts.get(comment.user.username)
      if (existing) {
        existing.count++
      } else {
        commenterCounts.set(comment.user.username, { user: comment.user, count: 1 })
      }
    }
  }

  const topCommenters: RankedUser[] = Array.from(commenterCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(({ user, count }) => ({
      username: user.username,
      fullName: user.full_name,
      avatarUrl: user.profile_pic_url || null,
      count,
      isVerified: user.is_verified,
    }))

  // Top likers (from post data - we track who liked each post)
  // Note: This requires fetching likes per post, which we do in snapshot
  const topLikers: RankedUser[] = [] // Will be populated by snapshot

  // Top hashtags
  const hashtagCounts = new Map<string, number>()
  for (const post of posts) {
    const text = post.caption?.text || ''
    const tags = text.match(/#[\w\u00C0-\u024F]+/g) || []
    for (const tag of tags) {
      const normalized = tag.slice(1).toLowerCase()
      hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1)
    }
  }

  const topHashtags: RankedHashtag[] = Array.from(hashtagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }))

  // Top mentioned users
  const mentionCounts = new Map<string, number>()
  for (const post of posts) {
    const text = post.caption?.text || ''
    const mentions = text.match(/@([\w.]+)/g) || []
    for (const mention of mentions) {
      const username = mention.slice(1).toLowerCase()
      mentionCounts.set(username, (mentionCounts.get(username) || 0) + 1)
    }
  }

  const topMentioned: RankedUser[] = Array.from(mentionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([username, count]) => ({
      username,
      fullName: '',
      avatarUrl: null,
      count,
      isVerified: false,
    }))

  return {
    topCommenters,
    topLikers,
    topHashtags,
    topMentioned,
  }
}

function analyzeActivity(posts: IGMedia[]): ActivitySummary {
  if (posts.length === 0) {
    return {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      avgPostsPerMonth: 0,
      mostActiveHour: 0,
      mostActiveDay: 'Unknown',
    }
  }

  // Calculate posts per month
  const timestamps = posts.map(p => p.taken_at * 1000)
  const oldest = Math.min(...timestamps)
  const newest = Math.max(...timestamps)
  const monthsSpan = Math.max(1, (newest - oldest) / (30 * 24 * 60 * 60 * 1000))
  const avgPostsPerMonth = Math.round(posts.length / monthsSpan)

  // Find most active hour
  const hourCounts = new Array(24).fill(0)
  const dayCounts = new Array(7).fill(0)
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  for (const post of posts) {
    const date = new Date(post.taken_at * 1000)
    hourCounts[date.getHours()]++
    dayCounts[date.getDay()]++
  }

  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))
  const mostActiveDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))]

  return {
    postsCount: posts.length,
    followersCount: 0, // Will be filled by caller
    followingCount: 0,
    avgPostsPerMonth,
    mostActiveHour,
    mostActiveDay,
  }
}

function analyzeInteractions(
  followers: IGUser[],
  following: IGUser[]
): { mutualFollowers: { user1: string; user2: string }[]; mostInteracted: RankedUser[] } {
  // Find mutual followers (who follows them AND they follow back)
  const followerUsernames = new Set(followers.map(f => f.username))
  const followingUsernames = new Set(following.map(f => f.username))

  const mutualFollowers: { user1: string; user2: string }[] = []
  for (const f of followers) {
    if (followingUsernames.has(f.username)) {
      mutualFollowers.push({ user1: 'target', user2: f.username })
    }
  }

  // Most interacted (simplified - based on follower/following overlap)
  const mostInteracted: RankedUser[] = followers
    .filter(f => followingUsernames.has(f.username))
    .slice(0, 20)
    .map(f => ({
      username: f.username,
      fullName: f.full_name,
      avatarUrl: f.profile_pic_url || null,
      count: 1, // Will be enriched with actual interaction data
      isVerified: f.is_verified,
    }))

  return {
    mutualFollowers,
    mostInteracted,
  }
}

function detectAnomalies(
  posts: IGMedia[],
  followers: IGUser[]
): { type: string; description: string; severity: 'low' | 'medium' | 'high' }[] {
  const anomalies: { type: string; description: string; severity: 'low' | 'medium' | 'high' }[] = []

  // Check for sudden spikes in engagement
  if (posts.length >= 5) {
    const recentPosts = posts.slice(0, 5)
    const olderPosts = posts.slice(5, 15)

    if (olderPosts.length > 0) {
      const recentAvgLikes = recentPosts.reduce((s, p) => s + p.like_count, 0) / recentPosts.length
      const olderAvgLikes = olderPosts.reduce((s, p) => s + p.like_count, 0) / olderPosts.length

      if (olderAvgLikes > 0 && recentAvgLikes > olderAvgLikes * 3) {
        anomalies.push({
          type: 'engagement_spike',
          description: `Curtidas aumentaram ${Math.round((recentAvgLikes / olderAvgLikes - 1) * 100)}% nos últimos posts`,
          severity: 'high',
        })
      }
    }
  }

  // Check for suspicious follower patterns
  if (followers.length > 100) {
    const recentFollowers = followers.slice(0, 20)
    const privateCount = recentFollowers.filter(f => f.is_private).length
    const noPostCount = recentFollowers.filter(f => (f.media_count || 0) === 0).length

    if (privateCount > 15) {
      anomalies.push({
        type: 'suspicious_followers',
        description: `${privateCount} dos últimos 20 seguidores são perfis privados`,
        severity: 'medium',
      })
    }

    if (noPostCount > 15) {
      anomalies.push({
        type: 'bot_followers',
        description: `${noPostCount} dos últimos 20 seguidores não têm posts (possíveis bots)`,
        severity: 'high',
      })
    }
  }

  return anomalies
}
