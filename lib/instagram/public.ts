export interface InstagramPublicProfile {
  username: string
  displayName: string
  fullName: string
  bio: string | null
  avatarUrl: string | null
  followers: number | null
  following: number | null
  posts: number | null
  isVerified: boolean
  isPrivate: boolean
  isBusiness: boolean
  externalUrl: string | null
  category: string | null
  publicEmail: string | null
  publicPhone: string | null
  city: string | null
  profileUrl: string
  source: 'embedded-json' | 'og-tags' | 'authenticated'
}

export interface InstagramFetchOptions {
  sessionCookie?: string
  proxyUrl?: string
  timeout?: number
}

const IG_APP_ID = '936619743392459'

function buildHeaders(options?: InstagramFetchOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  }

  if (options?.sessionCookie) {
    headers['Cookie'] = options.sessionCookie
    headers['X-IG-App-ID'] = IG_APP_ID
    headers['X-Requested-With'] = 'XMLHttpRequest'
  }

  return headers
}

function parseCount(s: string): number {
  const clean = s.replace(/,/g, '').trim()
  if (clean.endsWith('M')) return Math.round(parseFloat(clean) * 1_000_000)
  if (clean.endsWith('K')) return Math.round(parseFloat(clean) * 1_000)
  if (clean.endsWith('B')) return Math.round(parseFloat(clean) * 1_000_000_000)
  return parseInt(clean, 10) || 0
}

function cleanStr(s: string): string {
  return s
    .replace(/\\u0026/g, '&')
    .replace(/&#064;/g, '@')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim()
}

function extractFromEmbeddedJSON(html: string, username: string): InstagramPublicProfile | null {
  const fieldPatterns: Record<string, RegExp> = {
    pk: /"pk":\s*(\d+)/,
    follower_count: /"follower_count":\s*(\d+)/,
    following_count: /"following_count":\s*(\d+)/,
    media_count: /"media_count":\s*(\d+)/,
    full_name: /"full_name":\s*"((?:[^"\\]|\\.)*)"/,
    biography: /"biography":\s*"((?:[^"\\]|\\.)*)"/,
    is_verified: /"is_verified":\s*(true|false)/,
    is_private: /"is_private":\s*(true|false)/,
    is_business: /"is_business":\s*(true|false)/,
    profile_pic_url: /"profile_pic_url":\s*"((?:[^"\\]|\\.)*)"/,
    profile_pic_url_hd: /"profile_pic_url_hd":\s*"((?:[^"\\]|\\.)*)"/,
    external_url: /"external_url":\s*"((?:[^"\\]|\\.)*)"/,
    category: /"category":\s*"((?:[^"\\]|\\.)*)"/,
    public_email: /"public_email":\s*"((?:[^"\\]|\\.)*)"/,
    public_phone_number: /"public_phone_number":\s*"((?:[^"\\]|\\.)*)"/,
    city_name: /"city_name":\s*"((?:[^"\\]|\\.)*)"/,
  }

  const hasUsername = html.includes(`"username":"${username}"`) || html.includes(`"username":"${username}"`)
  if (!hasUsername) return null

  const extracted: Record<string, string | number | boolean> = {}
  for (const [field, pattern] of Object.entries(fieldPatterns)) {
    const match = html.match(pattern)
    if (match) {
      let value: string | number | boolean = match[1]
      if (field === 'is_verified' || field === 'is_private' || field === 'is_business') {
        value = value === 'true'
      } else if (['pk', 'follower_count', 'following_count', 'media_count'].includes(field)) {
        value = parseInt(value as string, 10) || 0
      } else {
        value = cleanStr(value as string)
      }
      extracted[field] = value
    }
  }

  if (!extracted.full_name && !extracted.follower_count) return null

  return {
    username: (extracted.username as string) ?? username,
    displayName: (extracted.full_name as string) ?? username,
    fullName: (extracted.full_name as string) ?? username,
    bio: (extracted.biography as string) ?? null,
    avatarUrl: (extracted.profile_pic_url_hd as string) ?? (extracted.profile_pic_url as string) ?? null,
    followers: (extracted.follower_count as number) ?? null,
    following: (extracted.following_count as number) ?? null,
    posts: (extracted.media_count as number) ?? null,
    isVerified: (extracted.is_verified as boolean) ?? false,
    isPrivate: (extracted.is_private as boolean) ?? false,
    isBusiness: (extracted.is_business as boolean) ?? false,
    externalUrl: (extracted.external_url as string) ?? null,
    category: (extracted.category as string) ?? null,
    publicEmail: (extracted.public_email as string) ?? null,
    publicPhone: (extracted.public_phone_number as string) ?? null,
    city: (extracted.city_name as string) ?? null,
    profileUrl: `https://www.instagram.com/${username}/`,
    source: 'embedded-json',
  }
}

function extractFromOGTags(html: string, username: string): InstagramPublicProfile | null {
  const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i)

  if (!ogDesc && !ogTitle) return null

  const description = ogDesc?.[1] ?? ''
  const title = ogTitle?.[1] ?? ''
  const image = ogImage?.[1]?.replace(/&amp;/g, '&') ?? null

  const followersMatch = description.match(/([\d,.]+[KMB]?)\s*Followers/i)
  const followingMatch = description.match(/([\d,.]+[KMB]?)\s*Following/i)
  const postsMatch = description.match(/([\d,.]+[KMB]?)\s*Posts/i)

  const displayName = title
    .replace(/@/g, '')
    .split('•')[0]
    .split(' on Instagram')[0]
    .trim()

  const bioPart = description.split(' - ')[0]?.trim() || null

  const isVerified = html.includes('"is_verified":true') || html.includes('isVerified":true')
  const isPrivate = html.includes('"is_private":true') || html.includes('"isPrivate":true')

  return {
    username,
    displayName: displayName || username,
    fullName: displayName || username,
    bio: bioPart,
    avatarUrl: image,
    followers: followersMatch ? parseCount(followersMatch[1]) : null,
    following: followingMatch ? parseCount(followingMatch[1]) : null,
    posts: postsMatch ? parseCount(postsMatch[1]) : null,
    isVerified,
    isPrivate,
    isBusiness: false,
    externalUrl: null,
    category: null,
    publicEmail: null,
    publicPhone: null,
    city: null,
    profileUrl: `https://www.instagram.com/${username}/`,
    source: 'og-tags',
  }
}

async function fetchWithProxy(
  url: string,
  headers: Record<string, string>,
  proxyUrl?: string,
  timeoutMs: number = 15000
): Promise<string> {
  const fetchOptions: RequestInit = {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  }

  const res = await fetch(url, fetchOptions)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export async function fetchPublicProfile(
  username: string,
  options?: InstagramFetchOptions
): Promise<InstagramPublicProfile | null> {
  const cleanUsername = username.replace('@', '').trim()
  if (!cleanUsername || cleanUsername.length > 30) return null

  const headers = buildHeaders(options)
  const timeout = options?.timeout ?? 15000

  try {
    const res = await fetch(
      `https://www.instagram.com/${cleanUsername}/`,
      {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout),
      }
    )

    const status = res.status

    if (status === 404) return null

    const html = await res.text()

    if (html.includes('Sorry, this page isn\'t available') || html.includes('page_not_found')) return null

    const isPrivatePage = html.includes('"is_private":true') || html.includes('This Account is Private')

    const embedded = extractFromEmbeddedJSON(html, cleanUsername)
    if (embedded) {
      if (isPrivatePage) embedded.isPrivate = true
      return embedded
    }

    const og = extractFromOGTags(html, cleanUsername)
    if (og) {
      if (isPrivatePage) og.isPrivate = true
      return og
    }

    return null
  } catch (err) {
    console.error(`[instagram/public] Failed to fetch @${cleanUsername}:`, err)
    return null
  }
}

export async function fetchWithSession(
  username: string,
  sessionCookie: string,
  options?: InstagramFetchOptions
): Promise<InstagramPublicProfile | null> {
  const cleanUsername = username.replace('@', '').trim()
  if (!cleanUsername || !sessionCookie) return null

  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'X-IG-App-ID': IG_APP_ID,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': '*/*',
          'Cookie': sessionCookie,
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      return fetchPublicProfile(cleanUsername, options)
    }

    const data = await res.json()
    const user = data?.data?.user
    if (!user) return fetchPublicProfile(cleanUsername, options)

    return {
      username: user.username ?? cleanUsername,
      displayName: user.full_name ?? cleanUsername,
      fullName: user.full_name ?? cleanUsername,
      bio: user.biography ?? null,
      avatarUrl: user.profile_pic_url_hd ?? user.profile_pic_url ?? null,
      followers: user.edge_followed_by?.count ?? null,
      following: user.edge_follow?.count ?? null,
      posts: user.edge_owner_to_timeline_media?.count ?? null,
      isVerified: Boolean(user.is_verified),
      isPrivate: Boolean(user.is_private),
      isBusiness: Boolean(user.is_business),
      externalUrl: user.external_url ?? null,
      category: user.category ?? null,
      publicEmail: user.public_email ?? null,
      publicPhone: user.public_phone_number ?? null,
      city: user.city_name ?? null,
      profileUrl: `https://www.instagram.com/${cleanUsername}/`,
      source: 'authenticated',
    }
  } catch (err) {
    console.error(`[instagram/auth] Failed for @${cleanUsername}:`, err)
    return fetchPublicProfile(cleanUsername, options)
  }
}
