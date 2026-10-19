import { fetchPublicProfile as fetchInstagram, InstagramPublicProfile, InstagramFetchOptions } from './instagram/public'
import { fetchFacebookPublic, FacebookPublicProfile } from './facebook/public'
import { fetchTikTokPublic, TikTokPublicProfile } from './tiktok/public'
import { checkTelegram, TelegramResult } from './telegram-osint'

export interface SocialProfile {
  platform: string
  username: string
  displayName: string
  fullName: string
  bio: string | null
  avatarUrl: string | null
  profileUrl: string
  followers: number | null
  following: number | null
  posts: number | null
  likes: number | null
  isVerified: boolean | null
  isPrivate: boolean | null
  isBusiness: boolean | null
  externalUrl: string | null
  category: string | null
  publicEmail: string | null
  publicPhone: string | null
  city: string | null
  work: string | null
  education: string | null
  friends: number | null
  videos: number | null
  website: string | null
  extra: Record<string, unknown>
  source: string
  fetchedAt: number
}

interface PlatformFetcher {
  name: string
  slug: string
  fetch: (username: string, options?: InstagramFetchOptions) => Promise<SocialProfile | null>
}

const PLATFORM_MAP: Record<string, string> = {
  'instagram': 'instagram',
  'facebook': 'facebook',
  'tiktok': 'tiktok',
  'telegram': 'telegram',
  'x (twitter)': 'twitter',
  'twitter': 'twitter',
  'twitter/x': 'twitter',
  'youtube': 'youtube',
  'linkedin': 'linkedin',
  'reddit': 'reddit',
  'github': 'github',
  'threads': 'threads',
  'snapchat': 'snapchat',
  'pinterest': 'pinterest',
  'spotify': 'spotify',
  'twitch': 'twitch',
}

function instagramToProfile(p: InstagramPublicProfile): SocialProfile {
  return {
    platform: 'Instagram',
    username: p.username,
    displayName: p.displayName,
    fullName: p.fullName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    profileUrl: p.profileUrl,
    followers: p.followers,
    following: p.following,
    posts: p.posts,
    likes: null,
    isVerified: p.isVerified,
    isPrivate: p.isPrivate,
    isBusiness: p.isBusiness,
    externalUrl: p.externalUrl,
    category: p.category,
    publicEmail: p.publicEmail,
    publicPhone: p.publicPhone,
    city: p.city,
    work: null,
    education: null,
    friends: null,
    videos: null,
    website: p.externalUrl,
    extra: {},
    source: p.source,
    fetchedAt: Date.now(),
  }
}

function facebookToProfile(p: FacebookPublicProfile): SocialProfile {
  return {
    platform: 'Facebook',
    username: p.username,
    displayName: p.displayName,
    fullName: p.displayName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    profileUrl: `https://www.facebook.com/${p.username}`,
    followers: null,
    following: null,
    posts: null,
    likes: null,
    isVerified: null,
    isPrivate: p.isPrivate,
    isBusiness: null,
    externalUrl: null,
    category: null,
    publicEmail: null,
    publicPhone: null,
    city: p.city,
    work: p.work,
    education: p.education,
    friends: p.friends,
    videos: null,
    website: null,
    extra: {},
    source: 'facebook-graph',
    fetchedAt: Date.now(),
  }
}

function tiktokToProfile(p: TikTokPublicProfile): SocialProfile {
  return {
    platform: 'TikTok',
    username: p.username,
    displayName: p.displayName,
    fullName: p.displayName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    profileUrl: `https://www.tiktok.com/@${p.username}`,
    followers: p.followers,
    following: p.following,
    posts: p.videos,
    likes: p.likes,
    isVerified: null,
    isPrivate: null,
    isBusiness: null,
    externalUrl: null,
    category: null,
    publicEmail: null,
    publicPhone: null,
    city: null,
    work: null,
    education: null,
    friends: null,
    videos: p.videos,
    website: null,
    extra: {},
    source: 'tiktok-html',
    fetchedAt: Date.now(),
  }
}

function telegramToProfile(p: TelegramResult): SocialProfile {
  return {
    platform: 'Telegram',
    username: p.username,
    displayName: p.displayName || p.username,
    fullName: p.displayName || p.username,
    bio: p.bio,
    avatarUrl: p.avatar,
    profileUrl: p.url,
    followers: null,
    following: null,
    posts: null,
    likes: null,
    isVerified: null,
    isPrivate: null,
    isBusiness: null,
    externalUrl: null,
    category: null,
    publicEmail: null,
    publicPhone: null,
    city: null,
    work: null,
    education: null,
    friends: null,
    videos: null,
    website: null,
    extra: {},
    source: 'telegram-html',
    fetchedAt: Date.now(),
  }
}

async function fetchGitHubProfile(username: string): Promise<SocialProfile | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'ShandonElite-OSINT/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const d = await res.json()
    return {
      platform: 'GitHub',
      username: d.login ?? username,
      displayName: d.name ?? username,
      fullName: d.name ?? username,
      bio: d.bio ?? null,
      avatarUrl: d.avatar_url ?? null,
      profileUrl: d.html_url ?? `https://github.com/${username}`,
      followers: d.followers ?? null,
      following: d.following ?? null,
      posts: d.public_repos ?? null,
      likes: null,
      isVerified: null,
      isPrivate: null,
      isBusiness: null,
      externalUrl: d.blog || null,
      category: null,
      publicEmail: d.email ?? null,
      publicPhone: null,
      city: d.location ?? null,
      work: d.company ?? null,
      education: null,
      friends: null,
      videos: null,
      website: d.blog || null,
      extra: { twitter_username: d.twitter_username, blog: d.blog },
      source: 'github-api',
      fetchedAt: Date.now(),
    }
  } catch {
    return null
  }
}

async function fetchRedditProfile(username: string): Promise<SocialProfile | null> {
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { 'User-Agent': 'ShandonElite-OSINT/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const d = data?.data
    if (!d) return null
    return {
      platform: 'Reddit',
      username: d.name ?? username,
      displayName: d.subreddit?.title ?? d.name ?? username,
      fullName: d.subreddit?.title ?? d.name ?? username,
      bio: d.subreddit?.public_description ?? null,
      avatarUrl: d.icon_img ?? null,
      profileUrl: `https://reddit.com/user/${username}`,
      followers: d.subscribers ?? null,
      following: null,
      posts: null,
      likes: null,
      isVerified: null,
      isPrivate: d.subreddit?.over_18 ?? null,
      isBusiness: null,
      externalUrl: null,
      category: null,
      publicEmail: null,
      publicPhone: null,
      city: null,
      work: null,
      education: null,
      friends: null,
      videos: null,
      website: null,
      extra: { created_utc: d.created_utc, link_karma: d.link_karma, comment_karma: d.comment_karma },
      source: 'reddit-api',
      fetchedAt: Date.now(),
    }
  } catch {
    return null
  }
}

const FETCHERS: Record<string, (username: string, options?: InstagramFetchOptions) => Promise<SocialProfile | null>> = {
  instagram: (u, o) => fetchInstagram(u, o).then(p => p ? instagramToProfile(p) : null),
  facebook: (u) => fetchFacebookPublic(u).then(p => p ? facebookToProfile(p) : null),
  tiktok: (u) => fetchTikTokPublic(u).then(p => p ? tiktokToProfile(p) : null),
  telegram: (u) => checkTelegram(u).then(p => p.exists ? telegramToProfile(p) : null),
  github: fetchGitHubProfile,
  reddit: fetchRedditProfile,
  twitter: async () => null,
  youtube: async () => null,
  linkedin: async () => null,
  threads: async () => null,
  snapchat: async () => null,
  pinterest: async () => null,
  spotify: async () => null,
  twitch: async () => null,
}

export function getPlatformSlug(platform: string): string | null {
  return PLATFORM_MAP[platform.toLowerCase()] ?? null
}

export async function fetchSocialProfile(
  platform: string,
  username: string,
  options?: InstagramFetchOptions
): Promise<SocialProfile | null> {
  const slug = getPlatformSlug(platform)
  if (!slug) return null
  const fetcher = FETCHERS[slug]
  if (!fetcher) return null
  return fetcher(username, options)
}

export async function fetchAllSocialProfiles(
  platforms: string[],
  username: string,
  options?: InstagramFetchOptions,
  concurrency: number = 3
): Promise<SocialProfile[]> {
  const uniquePlatforms = [...new Set(platforms.map(p => getPlatformSlug(p)).filter(Boolean))] as string[]
  const results: SocialProfile[] = []

  for (let i = 0; i < uniquePlatforms.length; i += concurrency) {
    const batch = uniquePlatforms.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(slug => FETCHERS[slug]?.(username, options))
    )
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      }
    }
  }

  return results
}

export function profileToSearchResult(profile: SocialProfile): {
  id: string
  platform: string
  username: string
  displayName: string
  score: number
  bio?: string
  followers?: string
  following?: string
  posts?: string
  avatar?: string
  url?: string
  exists: boolean
  status: string
  httpStatus: number
  source: string
  timestamp: number
  extra: Record<string, unknown>
} {
  return {
    id: `${profile.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}-${profile.username}`,
    platform: profile.platform,
    username: profile.username,
    displayName: profile.fullName || profile.displayName,
    score: 100,
    bio: profile.bio ?? undefined,
    followers: profile.followers !== null ? String(profile.followers) : undefined,
    following: profile.following !== null ? String(profile.following) : undefined,
    posts: profile.posts !== null ? String(profile.posts) : undefined,
    avatar: profile.avatarUrl ?? undefined,
    url: profile.profileUrl,
    exists: true,
    status: 'found',
    httpStatus: 200,
    source: profile.source,
    timestamp: profile.fetchedAt,
    extra: {
      enriched: true,
      fullName: profile.fullName,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      isBusiness: profile.isBusiness,
      externalUrl: profile.externalUrl,
      category: profile.category,
      publicEmail: profile.publicEmail,
      publicPhone: profile.publicPhone,
      city: profile.city,
      work: profile.work,
      education: profile.education,
      friends: profile.friends,
      likes: profile.likes,
      videos: profile.videos,
      website: profile.website,
    },
  }
}
