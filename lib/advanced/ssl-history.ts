export interface SslHistoryResult {
  domain: string
  certificates: { issuer: string; validFrom: string; validTo: string; serialNumber: string }[]
  totalCerts: number
}

const CENSYS_API = 'https://search.censys.io/api'
const CRT_SH_API = 'https://crt.sh'
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

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

async function queryCrtSh(domain: string): Promise<{ issuer: string; validFrom: string; validTo: string; serialNumber: string }[]> {
  try {
    const url = `${CRT_SH_API}/?q=${encodeURIComponent(domain)}&output=json`
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return []

    const data = await response.json()

    if (!Array.isArray(data)) return []

    const certMap = new Map<string, { issuer: string; validFrom: string; validTo: string; serialNumber: string }>()

    data.forEach((cert: Record<string, unknown>) => {
      const issuer = String(cert.issuer_name || cert.issuer || 'Unknown')
      const notBefore = String(cert.not_before || '')
      const notAfter = String(cert.not_after || '')
      const serial = String(cert.serial_number || cert.serial || '')

      if (issuer && notBefore && serial && !certMap.has(serial)) {
        certMap.set(serial, {
          issuer: issuer.substring(0, 200),
          validFrom: notBefore,
          validTo: notAfter,
          serialNumber: serial
        })
      }
    })

    return Array.from(certMap.values()).slice(0, 50)
  } catch {
    return []
  }
}

async function queryCensys(domain: string): Promise<{ issuer: string; validFrom: string; validTo: string; serialNumber: string }[]> {
  const apiId = process.env.CENSYS_API_ID || ''
  const apiSecret = process.env.CENSYS_API_SECRET || ''

  if (!apiId || !apiSecret) {
    return []
  }

  try {
    const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString('base64')
    const url = `${CENSYS_API}/v2/certificates/search?q=${encodeURIComponent(domain)}&per_page=50`

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`
      }
    })

    if (!response.ok) return []

    const data = await response.json()

    if (!data.result || !data.result.hits) return []

    return data.result.hits.map((cert: Record<string, unknown>) => {
      const names = cert.names || []
      const issuer = (cert.issuer || {}) as Record<string, string>
      const parsed = (cert.parsed || {}) as Record<string, Record<string, number>>

      return {
        issuer: String(issuer.common_name || issuer.organization || 'Unknown'),
        validFrom: parsed.validity ? formatDate(parsed.validity.start || 0) : 'Unknown',
        validTo: parsed.validity ? formatDate(parsed.validity.end || 0) : 'Unknown',
        serialNumber: String((parsed as Record<string, unknown>).serial_number || 'Unknown')
      }
    })
  } catch {
    return []
  }
}

async function queryShodan(domain: string): Promise<{ issuer: string; validFrom: string; validTo: string; serialNumber: string }[]> {
  const apiKey = process.env.SHODAN_API_KEY || ''

  if (!apiKey) {
    return []
  }

  try {
    const url = `https://api.shodan.io/dns/resolve?hostnames=${encodeURIComponent(domain)}&key=${apiKey}`
    const response = await fetchWithTimeout(url)

    if (!response.ok) return []

    const data = await response.json()
    return []
  } catch {
    return []
  }
}

export async function checkSslHistory(domain: string): Promise<SslHistoryResult> {
  if (!domain || domain.trim().length === 0) {
    throw new Error('Domain is required')
  }

  const normalizedDomain = normalizeDomain(domain)

  const [crtShCerts, censysCerts, shodanCerts] = await Promise.all([
    queryCrtSh(normalizedDomain),
    queryCensys(normalizedDomain),
    queryShodan(normalizedDomain)
  ])

  const allCerts = [...crtShCerts, ...censysCerts, ...shodanCerts]

  const uniqueCerts = new Map<string, { issuer: string; validFrom: string; validTo: string; serialNumber: string }>()

  allCerts.forEach(cert => {
    const key = cert.serialNumber || `${cert.issuer}-${cert.validFrom}`
    if (!uniqueCerts.has(key)) {
      uniqueCerts.set(key, cert)
    }
  })

  const sortedCerts = Array.from(uniqueCerts.values()).sort((a, b) => {
    return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
  })

  return {
    domain: normalizedDomain,
    certificates: sortedCerts,
    totalCerts: sortedCerts.length
  }
}
