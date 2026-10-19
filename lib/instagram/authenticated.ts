export interface InstagramPost {
  url: string
  thumbnail: string
  caption: string
  likes: number
  comments: number
  timestamp: string
  isVideo: boolean
}

export interface InstagramAuthenticatedProfile {
  username: string
  fullName: string
  biography: string
  followers: number
  following: number
  posts: number
  isPrivate: boolean
  isVerified: boolean
  isBusiness: boolean
  profilePicUrl: string
  externalUrl: string | null
  postsData: InstagramPost[]
  topCommenters: { username: string; count: number }[]
  topLikers: { username: string; count: number }[]
  recentComments: { postUrl: string; author: string; text: string; timestamp: string }[]
  taggedUsers: string[]
  hashtagUsage: { tag: string; count: number }[]
  engagementRate: number
}

export interface InstagramProProfile {
  posts: InstagramPost[]
  topCommenters: { username: string; count: number }[]
  topLikers: { username: string; count: number }[]
  recentComments: { postUrl: string; author: string; text: string; timestamp: string }[]
  taggedUsers: string[]
  hashtagUsage: { tag: string; count: number }[]
  engagementRate: number
}

const IG_API = 'https://www.instagram.com/api/v1'
const IG_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'X-IG-App-ID': '936619743392459',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

function buildCookieHeader(sessionCookie: string): Record<string, string> {
  const cookies = sessionCookie
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
  const cookieStr = cookies.join('; ')
  return { Cookie: cookieStr }
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g)
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
}

function extractMentions(text: string): string[] {
  const matches = text.match(/@([\w.]+)/g)
  return matches ? matches.map((m) => m.slice(1).toLowerCase()) : []
}

async function fetchUserPosts(
  username: string,
  sessionCookie: string
): Promise<InstagramPost[]> {
  try {
    const res = await fetch(`${IG_API}/users/web_profile_info/?username=${username}`, {
      headers: {
        ...IG_HEADERS,
        ...buildCookieHeader(sessionCookie),
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return []

    const data = await res.json()
    const user = data?.data?.user
    if (!user) return []

    const edges = user.edge_owner_to_timeline_media?.edges ?? []

    return edges.map((edge: Record<string, unknown>) => {
      const node = edge.node as Record<string, unknown>
      const captionEdge = (node.edge_media_to_caption as { edges?: { node: { text: string } }[] })
      const caption = captionEdge?.edges?.[0]?.node?.text ?? ''

      return {
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        thumbnail: (node.thumbnail_src as string) ?? (node.display_url as string) ?? '',
        caption,
        likes: (node.edge_liked_by as { count: number })?.count ?? (node.edge_media_preview_like as { count: number })?.count ?? 0,
        comments: (node.edge_media_to_comment as { count: number })?.count ?? 0,
        timestamp: (node.taken_at_timestamp as string) ?? '',
        isVideo: Boolean(node.is_video),
      }
    })
  } catch (err) {
    console.error('[instagram/pro] fetchUserPosts error:', err)
    return []
  }
}

async function fetchRecentComments(
  shortcode: string,
  sessionCookie: string
): Promise<{ author: string; text: string; timestamp: string }[]> {
  try {
    const res = await fetch(`${IG_API}/media/${shortcode}/comments/?can_login=true`, {
      headers: {
        ...IG_HEADERS,
        ...buildCookieHeader(sessionCookie),
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const data = await res.json()
    const comments = data?.comments ?? []

    return comments.map((c: Record<string, unknown>) => ({
      author: (c.owner as Record<string, unknown>)?.username as string ?? '',
      text: (c.text as string) ?? '',
      timestamp: String(c.created_at ?? ''),
    }))
  } catch {
    return []
  }
}

export async function fetchProProfile(
  username: string,
  sessionCookie: string
): Promise<InstagramProProfile | null> {
  const cleanUsername = username.replace('@', '').trim()
  if (!cleanUsername || !sessionCookie) return null

  const posts = await fetchUserPosts(cleanUsername, sessionCookie)

  if (posts.length === 0) return null

  const commenterMap = new Map<string, number>()
  const likerMap = new Map<string, number>()
  const allTaggedUsers: string[] = []
  const allHashtags: string[] = []
  const recentComments: InstagramProProfile['recentComments'] = []

  for (const post of posts.slice(0, 12)) {
    allHashtags.push(...extractHashtags(post.caption))
    allTaggedUsers.push(...extractMentions(post.caption))

    const shortcode = post.url.split('/p/')[1]?.replace('/', '')
    if (shortcode) {
      const comments = await fetchRecentComments(shortcode, sessionCookie)
      for (const comment of comments) {
        commenterMap.set(comment.author, (commenterMap.get(comment.author) ?? 0) + 1)
        recentComments.push({
          postUrl: post.url,
          author: comment.author,
          text: comment.text,
          timestamp: comment.timestamp,
        })
      }
    }
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0)
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0)
  const totalEngagement = totalLikes + totalComments

  const hashtagCounts = new Map<string, number>()
  for (const tag of allHashtags) {
    hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1)
  }

  const taggedCounts = new Map<string, number>()
  for (const user of allTaggedUsers) {
    taggedCounts.set(user, (taggedCounts.get(user) ?? 0) + 1)
  }

  for (const [user] of taggedCounts) {
    likerMap.set(user, (likerMap.get(user) ?? 0) + 1)
  }

  return {
    posts,
    topCommenters: Array.from(commenterMap.entries())
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    topLikers: Array.from(likerMap.entries())
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    recentComments: recentComments
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50),
    taggedUsers: [...new Set(allTaggedUsers)],
    hashtagUsage: Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    engagementRate: posts.length > 0
      ? Math.round((totalEngagement / posts.length) * 100) / 100
      : 0,
  }
}

export async function fetchAuthenticatedProfile(
  username: string,
  sessionCookie: string
): Promise<InstagramAuthenticatedProfile | null> {
  const cleanUsername = username.replace('@', '').trim()
  if (!cleanUsername || !sessionCookie) return null

  try {
    const res = await fetch(`${IG_API}/users/web_profile_info/?username=${cleanUsername}`, {
      headers: {
        ...IG_HEADERS,
        ...buildCookieHeader(sessionCookie),
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const user = data?.data?.user
    if (!user) return null

    const edges = user.edge_owner_to_timeline_media?.edges ?? []
    const posts: InstagramPost[] = edges.map((edge: Record<string, unknown>) => {
      const node = edge.node as Record<string, unknown>
      const captionEdge = (node.edge_media_to_caption as { edges?: { node: { text: string } }[] })
      const caption = captionEdge?.edges?.[0]?.node?.text ?? ''

      return {
        url: `https://www.instagram.com/p/${node.shortcode}/`,
        thumbnail: (node.thumbnail_src as string) ?? (node.display_url as string) ?? '',
        caption,
        likes: (node.edge_liked_by as { count: number })?.count ?? (node.edge_media_preview_like as { count: number })?.count ?? 0,
        comments: (node.edge_media_to_comment as { count: number })?.count ?? 0,
        timestamp: (node.taken_at_timestamp as string) ?? '',
        isVideo: Boolean(node.is_video),
      }
    })

    const commenterMap = new Map<string, number>()
    const likerMap = new Map<string, number>()
    const allTaggedUsers: string[] = []
    const allHashtags: string[] = []
    const recentComments: InstagramAuthenticatedProfile['recentComments'] = []

    for (const post of posts.slice(0, 12)) {
      allHashtags.push(...extractHashtags(post.caption))
      allTaggedUsers.push(...extractMentions(post.caption))

      const shortcode = post.url.split('/p/')[1]?.replace('/', '')
      if (shortcode) {
        const comments = await fetchRecentComments(shortcode, sessionCookie)
        for (const comment of comments) {
          commenterMap.set(comment.author, (commenterMap.get(comment.author) ?? 0) + 1)
          recentComments.push({
            postUrl: post.url,
            author: comment.author,
            text: comment.text,
            timestamp: comment.timestamp,
          })
        }
      }
    }

    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0)
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0)
    const totalEngagement = totalLikes + totalComments

    const hashtagCounts = new Map<string, number>()
    for (const tag of allHashtags) {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1)
    }

    const taggedCounts = new Map<string, number>()
    for (const user of allTaggedUsers) {
      taggedCounts.set(user, (taggedCounts.get(user) ?? 0) + 1)
    }

    for (const [user] of taggedCounts) {
      likerMap.set(user, (likerMap.get(user) ?? 0) + 1)
    }

    return {
      username: user.username ?? cleanUsername,
      fullName: user.full_name ?? '',
      biography: user.biography ?? '',
      followers: user.edge_followed_by?.count ?? 0,
      following: user.edge_follow?.count ?? 0,
      posts: user.edge_owner_to_timeline_media?.count ?? 0,
      isPrivate: Boolean(user.is_private),
      isVerified: Boolean(user.is_verified),
      isBusiness: Boolean(user.is_business),
      profilePicUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? '',
      externalUrl: user.external_url ?? null,
      postsData: posts,
      topCommenters: Array.from(commenterMap.entries())
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      topLikers: Array.from(likerMap.entries())
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      recentComments: recentComments
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50),
      taggedUsers: [...new Set(allTaggedUsers)],
      hashtagUsage: Array.from(hashtagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count),
      engagementRate: posts.length > 0
        ? Math.round((totalEngagement / posts.length) * 100) / 100
        : 0,
    }
  } catch (err) {
    console.error('[instagram/authenticated] Error:', err)
    return null
  }
}
