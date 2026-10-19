export interface ForumResult {
  forum: string
  title: string
  url: string
  snippet: string
  date: string
}

const TIMEOUT_MS = 15000
const MAX_RESULTS = 10

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function searchAhmia(query: string): Promise<ForumResult[]> {
  try {
    const url = `https://ahmia.fi/api/v1/search?q=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ShandonElite-OSINT/1.0'
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    const results: ForumResult[] = []

    if (data && Array.isArray(data)) {
      for (const item of data.slice(0, MAX_RESULTS)) {
        results.push({
          forum: 'Ahmia (Tor)',
          title: item.title || item.name || 'Untitled',
          url: item.url || item.onion_url || '',
          snippet: item.description || item.text || 'No description',
          date: item.updated_at || item.published_date || new Date().toISOString()
        })
      }
    }

    return results
  } catch {
    return []
  }
}

async function searchExploit(query: string): Promise<ForumResult[]> {
  try {
    const url = `https://exploit.in/search?q=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: ForumResult[] = []

    const topicRegex = /<h3[^>]*class="[^"]*topic[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi
    let match: RegExpExecArray | null

    while ((match = topicRegex.exec(html)) !== null && results.length < MAX_RESULTS) {
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      let threadUrl = match[1]
      if (!threadUrl.startsWith('http')) {
        threadUrl = `https://exploit.in${threadUrl}`
      }

      results.push({
        forum: 'Exploit.in',
        title: title || 'Untitled',
        url: threadUrl,
        snippet: `Discussion related to ${query}`,
        date: new Date().toISOString()
      })
    }

    return results
  } catch {
    return []
  }
}

async function searchXssIs(query: string): Promise<ForumResult[]> {
  try {
    const url = `https://xss.is/search?q=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: ForumResult[] = []

    const topicRegex = /<h3[^>]*class="[^"]*topic[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi
    let match: RegExpExecArray | null

    while ((match = topicRegex.exec(html)) !== null && results.length < MAX_RESULTS) {
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      let threadUrl = match[1]
      if (!threadUrl.startsWith('http')) {
        threadUrl = `https://xss.is${threadUrl}`
      }

      results.push({
        forum: 'XSS.is',
        title: title || 'Untitled',
        url: threadUrl,
        snippet: `Discussion related to ${query}`,
        date: new Date().toISOString()
      })
    }

    return results
  } catch {
    return []
  }
}

async function searchBreachForums(query: string): Promise<ForumResult[]> {
  try {
    const url = `https://breachforums.is/search?q=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const results: ForumResult[] = []

    const topicRegex = /<h3[^>]*class="[^"]*topic[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi
    let match: RegExpExecArray | null

    while ((match = topicRegex.exec(html)) !== null && results.length < MAX_RESULTS) {
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      let threadUrl = match[1]
      if (!threadUrl.startsWith('http')) {
        threadUrl = `https://breachforums.is${threadUrl}`
      }

      results.push({
        forum: 'BreachForums',
        title: title || 'Untitled',
        url: threadUrl,
        snippet: `Discussion related to ${query}`,
        date: new Date().toISOString()
      })
    }

    return results
  } catch {
    return []
  }
}

export async function monitorForums(query: string): Promise<ForumResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required')
  }

  const trimmedQuery = query.trim()

  const searchPromises = [
    searchAhmia(trimmedQuery),
    searchExploit(trimmedQuery),
    searchXssIs(trimmedQuery),
    searchBreachForums(trimmedQuery)
  ]

  const settledResults = await Promise.allSettled(searchPromises)
  const allResults: ForumResult[] = []

  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value)
    }
  })

  allResults.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA
  })

  return allResults.slice(0, 50)
}
