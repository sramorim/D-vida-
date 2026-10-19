export interface WaybackProResult {
  url: string
  snapshots: { timestamp: string; url: string; status: string }[]
  totalSnapshots: number
  firstSeen: string
  lastSeen: string
}

const WAYBACK_API = 'https://web.archive.org/cdx/search/cdx'
const TIMEOUT_MS = 20000
const MAX_SNAPSHOTS = 100

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }
  try {
    const urlObj = new URL(normalized)
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}`
  } catch {
    return normalized
  }
}

function formatTimestamp(ts: string): string {
  if (ts.length === 14) {
    return `${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)} ${ts.substring(8, 10)}:${ts.substring(10, 12)}:${ts.substring(12, 14)}`
  }
  return ts
}

function getStatusLabel(code: string): string {
  const statusMap: Record<string, string> = {
    '200': 'OK',
    '301': 'Moved Permanently',
    '302': 'Found (Redirect)',
    '304': 'Not Modified',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Server Error'
  }
  return statusMap[code] || `Status ${code}`
}

export async function checkWaybackPro(url: string): Promise<WaybackProResult> {
  if (!url || url.trim().length === 0) {
    throw new Error('URL is required')
  }

  const normalizedUrl = normalizeUrl(url)

  try {
    const params = new URLSearchParams({
      url: normalizedUrl,
      output: 'json',
      limit: String(MAX_SNAPSHOTS),
      fl: 'timestamp,original,statuscode,mimetype',
      collapse: 'timestamp:8',
      filter: 'statuscode:200',
      sort: 'reverse'
    })

    const apiUrl = `${WAYBACK_API}?${params.toString()}`
    const response = await fetchWithTimeout(apiUrl, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Wayback Machine API returned status ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length <= 1) {
      return {
        url: normalizedUrl,
        snapshots: [],
        totalSnapshots: 0,
        firstSeen: '',
        lastSeen: ''
      }
    }

    const results = data.slice(1)
    const snapshots = results.map((row: string[]) => ({
      timestamp: formatTimestamp(row[0]),
      url: `https://web.archive.org/web/${row[0]}_/${row[1]}`,
      status: `${row[2]} - ${getStatusLabel(row[2])}`
    }))

    const timestamps = results.map((row: string[]) => row[0]).sort()

    return {
      url: normalizedUrl,
      snapshots: snapshots.slice(0, 50),
      totalSnapshots: results.length,
      firstSeen: formatTimestamp(timestamps[0] || ''),
      lastSeen: formatTimestamp(timestamps[timestamps.length - 1] || '')
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while checking Wayback Machine')
    }
    throw new Error(`Wayback Machine check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
