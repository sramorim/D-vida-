export interface AdultSiteResult {
  site: string
  category: 'cam' | 'dating' | 'adult'
  url: string
  found: boolean
  displayName?: string
  bio?: string
  followers?: number
  avatar?: string
}

interface AdultSiteConfig {
  name: string
  category: 'cam' | 'dating' | 'adult'
  url: string
  errorPatterns?: string[]
  errorStatuses?: number[]
}

const ADULT_SITES: AdultSiteConfig[] = [
  // Cam Sites
  { name: 'OnlyFans', category: 'cam', url: 'https://onlyfans.com/{u}' },
  { name: 'Fansly', category: 'cam', url: 'https://fansly.com/{u}' },
  { name: 'Chaturbate', category: 'cam', url: 'https://chaturbate.com/{u}' },
  { name: 'Stripchat', category: 'cam', url: 'https://stripchat.com/{u}' },
  { name: 'LiveJasmin', category: 'cam', url: 'https://livejasmin.com/{u}' },
  { name: 'MyFreeCams', category: 'cam', url: 'https://myfreecams.com/#/{u}' },
  { name: 'BongaCams', category: 'cam', url: 'https://bongacams.com/{u}' },

  // Dating Apps
  { name: 'Tinder', category: 'dating', url: 'https://www.gotinder.com/@{u}' },
  { name: 'Bumble', category: 'dating', url: 'https://bumble.com/@{u}' },
  { name: 'OkCupid', category: 'dating', url: 'https://www.okcupid.com/profile/{u}' },
  { name: 'Match', category: 'dating', url: 'https://www.match.com/profile/{u}' },
  { name: 'PlentyOfFish', category: 'dating', url: 'https://www.pof.com/profile/{u}' },
  { name: 'Zoosk', category: 'dating', url: 'https://www.zoosk.com/profile/{u}' },
  { name: 'Grindr', category: 'dating', url: 'https://www.grindr.com/profile/{u}' },
  { name: 'Hinge', category: 'dating', url: 'https://hinge.co/@{u}' },

  // Adult Content
  { name: 'Reddit NSFW', category: 'adult', url: 'https://www.reddit.com/user/{u}' },
  { name: 'Twitter/X NSFW', category: 'adult', url: 'https://x.com/{u}' },
  { name: 'Tumblr', category: 'adult', url: 'https://{u}.tumblr.com' },
  { name: 'Pornhub', category: 'adult', url: 'https://www.pornhub.com/users/{u}' },
  { name: 'XVideos', category: 'adult', url: 'https://www.xvideos.com/profiles/{u}' },
  { name: 'xHamster', category: 'adult', url: 'https://xhamster.com/users/{u}' },
]

const TIMEOUT_MS = 5000

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

export async function checkAdultSites(username: string): Promise<AdultSiteResult[]> {
  const cleanUsername = username.replace('@', '').trim()
  const results: AdultSiteResult[] = []

  const promises = ADULT_SITES.map(async (site) => {
    const url = site.url.replace('{u}', cleanUsername)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: HEADERS,
      })

      clearTimeout(timeoutId)

      const status = response.status
      const body = await response.text()

      let found = status === 200

      if (site.errorStatuses?.includes(status)) {
        found = false
      }

      if (found && site.errorPatterns) {
        for (const pattern of site.errorPatterns) {
          if (body.toLowerCase().includes(pattern.toLowerCase())) {
            found = false
            break
          }
        }
      }

      const result: AdultSiteResult = {
        site: site.name,
        category: site.category,
        url,
        found,
      }

      if (found) {
        const displayNameMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (displayNameMatch) {
          const title = displayNameMatch[1].trim()
          if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('not found')) {
            result.displayName = title.split(' - ')[0].split(' | ')[0].trim()
          }
        }

        const avatarMatch = body.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
        if (avatarMatch) {
          result.avatar = avatarMatch[1]
        }
      }

      return result
    } catch {
      return {
        site: site.name,
        category: site.category,
        url,
        found: false,
      }
    }
  })

  const settled = await Promise.allSettled(promises)
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    }
  }

  return results
}
