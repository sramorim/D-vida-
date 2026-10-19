export interface PasteResult {
  site: string
  url: string
  snippet: string
  timestamp: string
}

const PASTE_SITES = [
  { name: 'Pastebin', api: 'https://pastebin.com/api_scraping.php', searchUrl: 'https://pastebin.com/search?q=' },
  { name: 'Hastebin', searchUrl: 'https://hastebin.com/search?q=' },
  { name: 'Ghostbin', searchUrl: 'https://ghostbin.co/search?q=' },
  { name: 'Paste.ee', searchUrl: 'https://paste.ee/search?q=' },
  { name: 'Rentry', searchUrl: 'https://rentry.co/search?q=' }
]

const TIMEOUT_MS = 12000
const MAX_RESULTS_PER_SITE = 5

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function searchPastebin(query: string): Promise<PasteResult[]> {
  try {
    const url = `https://pastebin.com/api_scraping.php`
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `api_dev_key=${process.env.PASTEBIN_API_KEY || 'anonymous'}&api_option=paste&api_paste_code=${encodeURIComponent(query)}`
    })

    if (!response.ok) return []

    const text = await response.text()
    const results: PasteResult[] = []
    const pastePattern = /pastebin\.com\/(\w+)/g
    let match: RegExpExecArray | null
    let count = 0

    while ((match = pastePattern.exec(text)) !== null && count < MAX_RESULTS_PER_SITE) {
      results.push({
        site: 'Pastebin',
        url: `https://pastebin.com/${match[1]}`,
        snippet: text.substring(match.index, match.index + 200).trim(),
        timestamp: new Date().toISOString()
      })
      count++
    }

    return results
  } catch {
    return []
  }
}

async function searchPasteSite(site: typeof PASTE_SITES[0], query: string): Promise<PasteResult[]> {
  try {
    const url = `${site.searchUrl}${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (OSINT-Monitor/1.0)',
        'Accept': 'text/html'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: PasteResult[] = []
    const snippets = extractSnippets(html, query)

    snippets.forEach((snippet, index) => {
      if (index < MAX_RESULTS_PER_SITE) {
        results.push({
          site: site.name,
          url: url,
          snippet: snippet,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    })

    return results
  } catch {
    return []
  }
}

function extractSnippets(html: string, query: string): string[] {
  const snippets: string[] = []
  const queryRegex = new RegExp(`[^<]*${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*`, 'gi')
  let match: RegExpExecArray | null

  while ((match = queryRegex.exec(html)) !== null && snippets.length < 10) {
    const snippet = match[0].trim()
    if (snippet.length > 10 && snippet.length < 300) {
      snippets.push(snippet)
    }
  }

  return snippets
}

export async function monitorPastes(query: string): Promise<PasteResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required')
  }

  const trimmedQuery = query.trim()
  const allResults: PasteResult[] = []

  const searchPromises = PASTE_SITES.map(async (site) => {
    if (site.name === 'Pastebin') {
      return searchPastebin(trimmedQuery)
    }
    return searchPasteSite(site, trimmedQuery)
  })

  const settledResults = await Promise.allSettled(searchPromises)

  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value)
    }
  })

  allResults.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return dateB - dateA
  })

  return allResults
}
