export interface DarkSearchResult {
  title: string
  url: string
  description: string
  score: number
}

const AHMIA_API = 'https://ahmia.fi/api/v1'
const TIMEOUT_MS = 15000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

export async function darkWebSearch(query: string): Promise<DarkSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required')
  }

  try {
    const url = `${AHMIA_API}/search/?q=${encodeURIComponent(query.trim())}`
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Ahmia API returned status ${response.status}`)
    }

    const data = await response.json()

    if (!data || !Array.isArray(data.results)) {
      return []
    }

    return data.results.map((item: Record<string, unknown>) => ({
      title: String(item.title || 'Untitled'),
      url: String(item.url || ''),
      description: String(item.description || ''),
      score: Number(item.score || 0)
    })).filter((r: DarkSearchResult) => r.url.length > 0)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while searching dark web')
    }
    throw new Error(`Dark web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
