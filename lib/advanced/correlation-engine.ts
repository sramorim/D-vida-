export interface CorrelationResult {
  target: string
  connections: { platform: string; username: string; confidence: number }[]
  commonPatterns: string[]
}

const USERNAME_PATTERNS = [
  { pattern: /^[a-z]+$/, type: 'simple_alpha' },
  { pattern: /^[a-z]+\d+$/, type: 'alpha_numeric' },
  { pattern: /^[a-z]+_[a-z]+$/, type: 'underscore_separated' },
  { pattern: /^[a-z]+-[a-z]+$/, type: 'hyphen_separated' },
  { pattern: /^[a-z]+\.[a-z]+$/, type: 'dot_separated' },
  { pattern: /^[a-z]+[A-Z]/, type: 'camel_case' },
  { pattern: /^\d+[a-z]+$/, type: 'numeric_prefix' },
  { pattern: /^[a-z]+\d{2,4}$/, type: 'year_suffix' }
]

function extractUsernameVariants(username: string): string[] {
  const variants = new Set<string>()
  const base = username.toLowerCase().replace(/[^a-z0-9]/g, '')

  variants.add(base)
  variants.add(username)
  variants.add(username.toLowerCase())
  variants.add(username.toUpperCase())

  if (base.length > 3) {
    variants.add(base.substring(0, 3))
    variants.add(base.substring(0, 4))
    variants.add(base.substring(0, 5))
  }

  const withDots = base.replace(/[_-]/g, '.')
  const withHyphens = base.replace(/[._]/g, '-')
  const withUnderscores = base.replace(/[.-]/g, '_')

  variants.add(withDots)
  variants.add(withHyphens)
  variants.add(withUnderscores)

  if (!base.match(/\d/)) {
    variants.add(base + '01')
    variants.add(base + '1')
    variants.add(base + '123')
    variants.add(base + '1234')
  }

  if (base.match(/\d+$/)) {
    const withoutNums = base.replace(/\d+$/, '')
    if (withoutNums.length >= 3) {
      variants.add(withoutNums)
      variants.add(withoutNums + '0')
      variants.add(withoutNums + '1')
    }
  }

  return Array.from(variants).filter(v => v.length >= 3 && v.length <= 30)
}

function detectPatterns(username: string): string[] {
  const patterns: string[] = []

  USERNAME_PATTERNS.forEach(({ pattern, type }) => {
    if (pattern.test(username)) {
      patterns.push(type)
    }
  })

  if (username.match(/^\d{4}$/)) patterns.push('year_based')
  if (username.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) patterns.push('month_prefix')
  if (username.match(/^(x|z|q)_/)) patterns.push('hacker_style')
  if (username.match(/(admin|root|sys|mod)/i)) patterns.push('admin_style')
  if (username.match(/(dev|ops|eng|sec)/i)) patterns.push('tech_style')

  return patterns
}

function calculateConfidence(source: string, target: string): number {
  const sourceLower = source.toLowerCase()
  const targetLower = target.toLowerCase()

  if (sourceLower === targetLower) return 100

  if (sourceLower.includes(targetLower) || targetLower.includes(sourceLower)) {
    const shorter = Math.min(sourceLower.length, targetLower.length)
    const longer = Math.max(sourceLower.length, targetLower.length)
    return Math.round((shorter / longer) * 85)
  }

  const sourceAlpha = sourceLower.replace(/[^a-z]/g, '')
  const targetAlpha = targetLower.replace(/[^a-z]/g, '')

  if (sourceAlpha === targetAlpha) return 75

  const levenshteinDistance = computeLevenshtein(sourceLower, targetLower)
  const maxLen = Math.max(sourceLower.length, targetLower.length)
  const similarity = 1 - levenshteinDistance / maxLen

  if (similarity >= 0.8) return Math.round(similarity * 70)
  if (similarity >= 0.6) return Math.round(similarity * 50)
  if (similarity >= 0.4) return Math.round(similarity * 30)

  return 0
}

function computeLevenshtein(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export async function correlateData(data: Record<string, unknown>[]): Promise<CorrelationResult> {
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('At least one data point is required')
  }

  if (data.length > 50) {
    throw new Error('Maximum 50 data points for correlation')
  }

  const usernames = new Set<string>()
  const platforms = new Map<string, string>()

  data.forEach(item => {
    if (item.username && typeof item.username === 'string') {
      usernames.add(item.username)
    }
    if (item.platform && typeof item.platform === 'string' && item.username) {
      platforms.set(String(item.username), item.platform)
    }
    if (item.email && typeof item.email === 'string') {
      const emailUsername = String(item.email).split('@')[0]
      usernames.add(emailUsername)
    }
    if (item.handle && typeof item.handle === 'string') {
      usernames.add(String(item.handle))
    }
  })

  const primaryTarget = Array.from(usernames)[0] || 'unknown'

  const connections: { platform: string; username: string; confidence: number }[] = []

  const allVariants = new Map<string, Set<string>>()

  usernames.forEach(username => {
    const variants = extractUsernameVariants(username)
    variants.forEach(variant => {
      if (!allVariants.has(variant)) {
        allVariants.set(variant, new Set())
      }
      allVariants.get(variant)!.add(username)
    })
  })

  allVariants.forEach((sources, variant) => {
    if (sources.size > 1 || variant !== primaryTarget) {
      const platform = platforms.get(variant) || detectPlatform(variant)
      const confidence = calculateConfidence(primaryTarget, variant)

      if (confidence > 0) {
        connections.push({
          platform,
          username: variant,
          confidence
        })
      }
    }
  })

  connections.sort((a, b) => b.confidence - a.confidence)

  const uniqueConnections = connections.filter((conn, index, self) =>
    index === self.findIndex(c => c.username === conn.username && c.platform === conn.platform)
  ).slice(0, 20)

  const allPatterns = new Set<string>()
  usernames.forEach(username => {
    detectPatterns(username).forEach(pattern => allPatterns.add(pattern))
  })

  return {
    target: primaryTarget,
    connections: uniqueConnections,
    commonPatterns: Array.from(allPatterns)
  }
}

function detectPlatform(username: string): string {
  if (username.match(/^[a-z0-9_]{1,15}$/)) return 'Twitter/X'
  if (username.match(/^[a-zA-Z0-9._-]{1,30}$/)) return 'Instagram'
  if (username.match(/^[a-zA-Z0-9_-]{3,20}$/)) return 'Reddit'
  if (username.match(/^[a-zA-Z0-9-]{1,39}$/)) return 'GitHub'
  return 'Unknown Platform'
}
