/**
 * Instagram Authenticated Data Fetcher
 * 
 * Fetches complete data from Instagram using session cookie.
 * Supports pagination to get ALL followers, following, posts, etc.
 */

const IG_API = 'https://www.instagram.com/api/v1'
const IG_APP_ID = '936619743392459'

interface FetchOptions {
  cookie: string
  timeout?: number
}

interface PaginationParams {
  first?: number
  after?: string
}

// ==================== INTERFACES ====================

export interface IGUser {
  pk: number
  username: string
  full_name: string
  is_private: boolean
  is_verified: boolean
  is_business: boolean
  profile_pic_url: string
  profile_pic_url_hd?: string
  follower_count?: number
  following_count?: number
  media_count?: number
  biography?: string
  external_url?: string
  public_email?: string
  public_phone_number?: string
  city_name?: string
  category?: string
}

export interface IGMedia {
  pk: string
  id: string
  shortcode: string
  media_type: number
  image_versions2?: { candidates: { url: string; width: number; height: number }[] }
  video_versions?: { url: string; width: number; height: number }[]
  caption?: { text: string }
  like_count: number
  comment_count: number
  taken_at: number
  user: IGUser
  usertags?: { nodes: { user: IGUser }[] }
  location?: { name: string; address: string }
  is_video: boolean
  video_view_count?: number
}

export interface IGComment {
  pk: string
  text: string
  created_at: number
  user: IGUser
  like_count: number
  child_comment_count: number
}

export interface IGEdgeInfo {
  edges: { node: any }[]
  page_info: {
    has_next_page: boolean
    end_cursor: string | null
  }
  count: number
}

// ==================== INTERNAL HELPERS ====================

function buildHeaders(cookie: string): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    'X-IG-App-ID': IG_APP_ID,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': cookie,
  }
}

async function fetchWithTimeout(url: string, cookie: string, timeoutMs: number = 15000): Promise<any> {
  const res = await fetch(url, {
    headers: buildHeaders(cookie),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

// ==================== PUBLIC FUNCTIONS ====================

/**
 * Fetch user profile info
 */
export async function fetchUserProfile(username: string, options: FetchOptions): Promise<IGUser | null> {
  try {
    const data = await fetchWithTimeout(
      `${IG_API}/users/web_profile_info/?username=${username}`,
      options.cookie,
      options.timeout
    )

    return data?.data?.user || null
  } catch (err) {
    console.error('[auth-fetch] fetchUserProfile error:', err)
    return null
  }
}

/**
 * Fetch ALL followers with pagination
 */
export async function fetchAllFollowers(
  userId: number,
  options: FetchOptions,
  onProgress?: (count: number) => void
): Promise<IGUser[]> {
  const followers: IGUser[] = []
  let cursor: string | null = null
  let hasNext = true

  while (hasNext) {
    try {
      const params = new URLSearchParams({
        query_hash: 'c76146de99bb02f6415203be841dd25a',
        variables: JSON.stringify({
          id: userId,
          first: 50,
          after: cursor,
        }),
      })

      const data = await fetchWithTimeout(
        `${IG_API}/graphql/query/?${params.toString()}`,
        options.cookie,
        options.timeout
      )

      const edgeData = data?.data?.user?.edge_followed_by
      if (!edgeData) break

      const edges = edgeData.edges || []
      for (const edge of edges) {
        if (edge.node) {
          followers.push(edge.node)
        }
      }

      onProgress?.(followers.length)

      const pageInfo = edgeData.page_info
      hasNext = pageInfo?.has_next_page || false
      cursor = pageInfo?.end_cursor || null

      // Small delay to avoid rate limiting
      if (hasNext) {
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error('[auth-fetch] fetchAllFollowers pagination error:', err)
      break
    }
  }

  return followers
}

/**
 * Fetch ALL following with pagination
 */
export async function fetchAllFollowing(
  userId: number,
  options: FetchOptions,
  onProgress?: (count: number) => void
): Promise<IGUser[]> {
  const following: IGUser[] = []
  let cursor: string | null = null
  let hasNext = true

  while (hasNext) {
    try {
      const params = new URLSearchParams({
        query_hash: 'd04b0a864b4b5fa4d2d6892a7d154733',
        variables: JSON.stringify({
          id: userId,
          first: 50,
          after: cursor,
        }),
      })

      const data = await fetchWithTimeout(
        `${IG_API}/graphql/query/?${params.toString()}`,
        options.cookie,
        options.timeout
      )

      const edgeData = data?.data?.user?.edge_follow
      if (!edgeData) break

      const edges = edgeData.edges || []
      for (const edge of edges) {
        if (edge.node) {
          following.push(edge.node)
        }
      }

      onProgress?.(following.length)

      const pageInfo = edgeData.page_info
      hasNext = pageInfo?.has_next_page || false
      cursor = pageInfo?.end_cursor || null

      if (hasNext) {
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error('[auth-fetch] fetchAllFollowing pagination error:', err)
      break
    }
  }

  return following
}

/**
 * Fetch ALL posts with pagination
 */
export async function fetchAllPosts(
  userId: number,
  options: FetchOptions,
  onProgress?: (count: number) => void
): Promise<IGMedia[]> {
  const posts: IGMedia[] = []
  let cursor: string | null = null
  let hasNext = true

  while (hasNext) {
    try {
      const params = new URLSearchParams({
        query_hash: '472f257a42c089e60a0b80f1fa5572d5',
        variables: JSON.stringify({
          id: userId,
          first: 50,
          after: cursor,
        }),
      })

      const data = await fetchWithTimeout(
        `${IG_API}/graphql/query/?${params.toString()}`,
        options.cookie,
        options.timeout
      )

      const edgeData = data?.data?.user?.edge_owner_to_timeline_media
      if (!edgeData) break

      const edges = edgeData.edges || []
      for (const edge of edges) {
        if (edge.node) {
          posts.push(edge.node)
        }
      }

      onProgress?.(posts.length)

      const pageInfo = edgeData.page_info
      hasNext = pageInfo?.has_next_page || false
      cursor = pageInfo?.end_cursor || null

      if (hasNext) {
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error('[auth-fetch] fetchAllPosts pagination error:', err)
      break
    }
  }

  return posts
}

/**
 * Fetch comments for a specific post
 */
export async function fetchPostComments(
  shortcode: string,
  options: FetchOptions,
  onProgress?: (count: number) => void
): Promise<IGComment[]> {
  const comments: IGComment[] = []
  let cursor: string | null = null
  let hasNext = true

  while (hasNext) {
    try {
      const params = new URLSearchParams({
        query_hash: '51f9d78f0a2a8f4c12a4f6a6a8a8a8a8',
        variables: JSON.stringify({
          shortcode,
          first: 50,
          after: cursor,
        }),
      })

      const data = await fetchWithTimeout(
        `${IG_API}/graphql/query/?${params.toString()}`,
        options.cookie,
        options.timeout
      )

      const edgeData = data?.data?.shortcode_media?.edge_media_to_comment
      if (!edgeData) break

      const edges = edgeData.edges || []
      for (const edge of edges) {
        if (edge.node) {
          comments.push(edge.node)
        }
      }

      onProgress?.(comments.length)

      const pageInfo = edgeData.page_info
      hasNext = pageInfo?.has_next_page || false
      cursor = pageInfo?.end_cursor || null

      if (hasNext) {
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error('[auth-fetch] fetchPostComments pagination error:', err)
      break
    }
  }

  return comments
}

/**
 * Fetch likes for a specific post (who liked)
 */
export async function fetchPostLikes(
  shortcode: string,
  options: FetchOptions,
  onProgress?: (count: number) => void
): Promise<IGUser[]> {
  const likers: IGUser[] = []
  let cursor: string | null = null
  let hasNext = true

  while (hasNext) {
    try {
      const params = new URLSearchParams({
        query_hash: 'd5d763b1e7321dece732d0b3afbe44e8',
        variables: JSON.stringify({
          shortcode,
          first: 50,
          after: cursor,
        }),
      })

      const data = await fetchWithTimeout(
        `${IG_API}/graphql/query/?${params.toString()}`,
        options.cookie,
        options.timeout
      )

      const edgeData = data?.data?.shortcode_media?.edge_liked_by
      if (!edgeData) break

      const edges = edgeData.edges || []
      for (const edge of edges) {
        if (edge.node) {
          likers.push(edge.node)
        }
      }

      onProgress?.(likers.length)

      const pageInfo = edgeData.page_info
      hasNext = pageInfo?.has_next_page || false
      cursor = pageInfo?.end_cursor || null

      if (hasNext) {
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (err) {
      console.error('[auth-fetch] fetchPostLikes pagination error:', err)
      break
    }
  }

  return likers
}

/**
 * Fetch complete profile data (all at once)
 */
export async function fetchCompleteProfile(
  username: string,
  options: FetchOptions,
  onProgress?: (stage: string, count: number) => void
): Promise<{
  profile: IGUser | null
  followers: IGUser[]
  following: IGUser[]
  posts: IGMedia[]
} | null> {
  // First, get the basic profile
  onProgress?.('profile', 0)
  const profile = await fetchUserProfile(username, options)
  if (!profile) return null

  // If private, we can't get followers/following
  if (profile.is_private) {
    return {
      profile,
      followers: [],
      following: [],
      posts: [],
    }
  }

  // Get followers
  onProgress?.('followers', 0)
  const followers = await fetchAllFollowers(profile.pk, options, (count) => {
    onProgress?.('followers', count)
  })

  // Get following
  onProgress?.('following', 0)
  const following = await fetchAllFollowing(profile.pk, options, (count) => {
    onProgress?.('following', count)
  })

  // Get posts
  onProgress?.('posts', 0)
  const posts = await fetchAllPosts(profile.pk, options, (count) => {
    onProgress?.('posts', count)
  })

  return {
    profile,
    followers,
    following,
    posts,
  }
}
