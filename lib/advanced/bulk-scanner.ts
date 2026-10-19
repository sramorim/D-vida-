export interface BulkResult {
  target: string
  platform: string
  found: boolean
  url?: string
}

const PLATFORMS = [
  { name: 'GitHub', baseUrl: 'https://github.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'Twitter', baseUrl: 'https://twitter.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'Instagram', baseUrl: 'https://instagram.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'Reddit', baseUrl: 'https://reddit.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'LinkedIn', baseUrl: 'https://linkedin.com', checkPath: (u: string) => `/in/${u}`, method: 'GET' as const },
  { name: 'Pinterest', baseUrl: 'https://pinterest.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'TikTok', baseUrl: 'https://tiktok.com', checkPath: (u: string) => `/@${u}`, method: 'GET' as const },
  { name: 'YouTube', baseUrl: 'https://youtube.com', checkPath: (u: string) => `/@${u}`, method: 'GET' as const },
  { name: 'Medium', baseUrl: 'https://medium.com', checkPath: (u: string) => `/@${u}`, method: 'GET' as const },
  { name: 'DeviantArt', baseUrl: 'https://deviantart.com', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'Twitch', baseUrl: 'https://twitch.tv', checkPath: (u: string) => `/${u}`, method: 'GET' as const },
  { name: 'Minecraft', baseUrl: 'https://namemc.com', checkPath: (u: string) => `/profile/${u}`, method: 'GET' as const }
]

const TIMEOUT_MS = 10000
const MAX_USERNAME_LENGTH = 30
const CONCURRENCY_LIMIT = 6

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9._-]+$/
  return usernameRegex.test(username) && username.length > 0 && username.length <= MAX_USERNAME_LENGTH
}

async function checkPlatform(username: string, platform: typeof PLATFORMS[0]): Promise<BulkResult> {
  const url = `${platform.baseUrl}${platform.checkPath(username)}`

  try {
    const response = await fetchWithTimeout(url, {
      method: platform.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      redirect: 'manual'
    })

    const found = response.status === 200

    return {
      target: username,
      platform: platform.name,
      found,
      url: found ? url : undefined
    }
  } catch {
    return {
      target: username,
      platform: platform.name,
      found: false,
      url: undefined
    }
  }
}

async function checkWithCache(username: string, platform: typeof PLATFORMS[0]): Promise<BulkResult> {
  const cacheKey = `bulk_${username}_${platform.name}`

  try {
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    // Ignore cache errors
  }

  const result = await checkPlatform(username, platform)

  try {
    if (typeof sessionStorage !== 'undefined' && result.found) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
    }
  } catch {
    // Ignore cache write errors
  }

  return result
}

export async function bulkScan(usernames: string[]): Promise<BulkResult[]> {
  if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
    throw new Error('At least one username is required')
  }

  if (usernames.length > 20) {
    throw new Error('Maximum 20 usernames per bulk scan')
  }

  const validUsernames = usernames
    .map(u => u.trim())
    .filter(u => u.length > 0)
    .filter(validateUsername)

  if (validUsernames.length === 0) {
    throw new Error('No valid usernames provided. Use alphanumeric characters, dots, hyphens, and underscores only.')
  }

  const allResults: BulkResult[] = []

  for (let i = 0; i < validUsernames.length; i += CONCURRENCY_LIMIT) {
    const batch = validUsernames.slice(i, i + CONCURRENCY_LIMIT)
    const batchPromises = batch.flatMap(username =>
      PLATFORMS.map(platform => checkWithCache(username, platform))
    )

    const batchResults = await Promise.allSettled(batchPromises)

    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allResults.push(result.value)
      }
    })
  }

  return allResults
}
