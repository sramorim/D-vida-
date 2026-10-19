export interface DeepLeakResult {
  email: string
  found: boolean
  sources: string[]
  lastSeen: string
}

const HIBP_API = 'https://haveibeenpwned.com/api/v3'
const TIMEOUT_MS = 15000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function checkHIBP(email: string): Promise<{ sources: string[]; lastSeen: string }> {
  try {
    const url = `${HIBP_API}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'hibp-api-key': process.env.HIBP_API_KEY || '',
        'User-Agent': 'ShandonElite-OSINT/1.0'
      }
    })

    if (response.ok) {
      const breaches = await response.json()
      if (Array.isArray(breaches)) {
        const sources = breaches.map((b: Record<string, unknown>) => String(b.Name || ''))
        const latestBreach = breaches.reduce((latest: Record<string, unknown>, b: Record<string, unknown>) => {
          const bDate = new Date(String(b.BreachDate || ''))
          const lDate = new Date(String(latest.BreachDate || ''))
          return bDate > lDate ? b : latest
        }, breaches[0])
        const lastSeen = latestBreach?.BreachDate || ''
        return { sources, lastSeen }
      }
    }

    return { sources: [], lastSeen: '' }
  } catch {
    return { sources: [], lastSeen: '' }
  }
}

async function checkLeakCheck(email: string): Promise<string[]> {
  try {
    const url = `https://leakcheck.io/api/public?check=${encodeURIComponent(email)}`
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      if (data && data.sources && Array.isArray(data.sources)) {
        return data.sources.map((s: Record<string, unknown>) => String(s.name || s.source || 'Unknown'))
      }
    }

    return []
  } catch {
    return []
  }
}

export async function checkDeepLeak(email: string): Promise<DeepLeakResult> {
  if (!email || !validateEmail(email)) {
    throw new Error('A valid email address is required')
  }

  const normalizedEmail = email.toLowerCase().trim()
  const sources: string[] = []

  const [hibpResult, leakCheckSources] = await Promise.all([
    checkHIBP(normalizedEmail),
    checkLeakCheck(normalizedEmail)
  ])

  sources.push(...hibpResult.sources)
  for (const src of leakCheckSources) {
    if (!sources.includes(src)) {
      sources.push(src)
    }
  }

  const lastSeen = hibpResult.lastSeen || (sources.length > 0 ? 'Unknown' : '')

  return {
    email: normalizedEmail,
    found: sources.length > 0,
    sources,
    lastSeen
  }
}
