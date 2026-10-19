export interface CredentialResult {
  email: string
  passwordFound: boolean
  count: number
  riskLevel: string
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

function calculateRiskLevel(leakCount: number, hasPassword: boolean): string {
  if (hasPassword && leakCount >= 5) return 'CRITICAL'
  if (hasPassword && leakCount >= 3) return 'HIGH'
  if (hasPassword) return 'MEDIUM'
  if (leakCount >= 3) return 'MEDIUM'
  if (leakCount >= 1) return 'LOW'
  return 'MINIMAL'
}

async function checkHaveIBeenPwned(email: string): Promise<{ count: number; breaches: string[] }> {
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
      return {
        count: Array.isArray(breaches) ? breaches.length : 0,
        breaches: Array.isArray(breaches)
          ? breaches.map((b: Record<string, unknown>) => String(b.Name || ''))
          : []
      }
    }

    if (response.status === 404) {
      return { count: 0, breaches: [] }
    }

    return { count: 0, breaches: [] }
  } catch {
    return { count: 0, breaches: [] }
  }
}

async function checkLeakCheck(email: string): Promise<{ count: number; passwordFound: boolean }> {
  try {
    const url = `https://leakcheck.io/api/public?check=${encodeURIComponent(email)}`
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      const count = data.found || (Array.isArray(data.sources) ? data.sources.length : 0)
      const passwordFound = data.has_password || data.password_found || false
      return { count, passwordFound }
    }

    return { count: 0, passwordFound: false }
  } catch {
    return { count: 0, passwordFound: false }
  }
}

async function checkPwnedPasswords(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    const prefix = hashHex.slice(0, 5)
    const suffix = hashHex.slice(5)

    const response = await fetchWithTimeout(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    })

    if (response.ok) {
      const text = await response.text()
      const lines = text.split('\n')
      for (const line of lines) {
        const [hash, count] = line.split(':')
        if (hash?.trim() === suffix && parseInt(count?.trim() || '0', 10) > 0) {
          return true
        }
      }
    }

    return false
  } catch {
    return false
  }
}

export async function checkCredentialLeak(email: string): Promise<CredentialResult> {
  if (!email || !validateEmail(email)) {
    throw new Error('A valid email address is required')
  }

  const normalizedEmail = email.toLowerCase().trim()

  const [hibpResult, leakCheckResult] = await Promise.all([
    checkHaveIBeenPwned(normalizedEmail),
    checkLeakCheck(normalizedEmail)
  ])

  const totalCount = hibpResult.count + leakCheckResult.count
  const hasPassword = leakCheckResult.passwordFound

  return {
    email: normalizedEmail,
    passwordFound: hasPassword,
    count: totalCount,
    riskLevel: calculateRiskLevel(totalCount, hasPassword)
  }
}
