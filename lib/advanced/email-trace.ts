export interface EmailTraceResult {
  email: string
  mxRecords: string[]
  originCountry: string
  provider: string
  isValid: boolean
}

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

function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function detectProvider(domain: string): string {
  const providers: Record<string, string[]> = {
    'Google': ['gmail.com', 'googlemail.com', 'google.com'],
    'Microsoft': ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'hotmail.co.uk', 'outlook.co.uk'],
    'Yahoo': ['yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.ca', 'yahoo.com.au', 'ymail.com'],
    'ProtonMail': ['protonmail.com', 'proton.me', 'pm.me', 'protonmail.ch'],
    'Apple': ['icloud.com', 'me.com', 'mac.com'],
    'AOL': ['aol.com', 'aim.com'],
    'Zoho': ['zoho.com', 'zohomail.com', 'zoho.eu'],
    'Yandex': ['yandex.com', 'yandex.ru', 'yandex.ua'],
    'GMX': ['gmx.com', 'gmx.net', 'gmx.co.uk'],
    'Mail.ru': ['mail.ru', 'bk.ru', 'inbox.ru', 'list.ru'],
    'Tutanota': ['tutanota.com', 'tutanota.de', 'tuta.io', 'keemail.me'],
    'Fastmail': ['fastmail.com', 'fastmail.fm'],
    'iCloud': ['icloud.com'],
    'Riseup': ['riseup.net'],
    'Hushmail': ['hushmail.com']
  }

  const domainLower = domain.toLowerCase()

  for (const [provider, domains] of Object.entries(providers)) {
    if (domains.includes(domainLower)) {
      return provider
    }
  }

  if (domainLower.includes('google')) return 'Google (Custom)'
  if (domainLower.includes('microsoft') || domainLower.includes('outlook')) return 'Microsoft (Custom)'
  if (domainLower.includes('amazon')) return 'Amazon WorkMail'
  if (domainLower.includes('facebook')) return 'Facebook Work'
  if (domainLower.includes('github')) return 'GitHub'
  if (domainLower.includes('gitlab')) return 'GitLab'

  return 'Unknown Provider'
}

function detectCountryFromMx(mxRecords: string[]): string {
  const countryPatterns: Record<string, string[]> = {
    'United States': ['.google.com', '.googlemail.com', '.outlook.com', '.hotmail.com', '.yahoo.com', '.protonmail.com'],
    'Germany': ['.protonmail.ch', '.tutanota.de', '.gmx.net', '.web.de'],
    'Russia': ['.yandex.ru', '.mail.ru', '.bk.ru', '.inbox.ru'],
    'Switzerland': ['.protonmail.ch', '.proton.me'],
    'United Kingdom': ['.outlook.co.uk', '.yahoo.co.uk'],
    'Canada': ['.yahoo.ca'],
    'India': ['.yahoo.co.in'],
    'Australia': ['.yahoo.com.au'],
    'France': ['.orange.fr', '.wanadoo.fr', '.free.fr'],
    'Japan': ['.yahoo.co.jp', '.nifty.com'],
    'China': ['.qq.com', '.163.com', '.sina.com'],
    'Netherlands': ['.gmail.com', '.hotmail.com'],
    'Ireland': ['.google.com', '.outlook.com']
  }

  for (const mx of mxRecords) {
    const mxLower = mx.toLowerCase()
    for (const [country, patterns] of Object.entries(countryPatterns)) {
      if (patterns.some(pattern => mxLower.includes(pattern))) {
        return country
      }
    }
  }

  return 'Unknown'
}

async function queryMxRecords(domain: string): Promise<string[]> {
  try {
    const dnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`
    const response = await fetchWithTimeout(dnsUrl, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (data.Answer && Array.isArray(data.Answer)) {
      return data.Answer
        .filter((record: Record<string, unknown>) => record.type === 15)
        .map((record: Record<string, unknown>) => String(record.data || '').trim().replace(/\.$/, ''))
        .filter((record: string) => record.length > 0)
    }

    return []
  } catch {
    return []
  }
}

async function verifyEmailDomain(domain: string): Promise<boolean> {
  try {
    const mxRecords = await queryMxRecords(domain)
    return mxRecords.length > 0
  } catch {
    return false
  }
}

export async function traceEmail(email: string): Promise<EmailTraceResult> {
  if (!email || !validateEmailFormat(email)) {
    throw new Error('A valid email address is required')
  }

  const normalizedEmail = email.toLowerCase().trim()
  const domain = normalizedEmail.split('@')[1]

  const mxRecords = await queryMxRecords(domain)
  const provider = detectProvider(domain)
  const originCountry = detectCountryFromMx(mxRecords)

  const isValid = mxRecords.length > 0

  return {
    email: normalizedEmail,
    mxRecords,
    originCountry,
    provider,
    isValid
  }
}
