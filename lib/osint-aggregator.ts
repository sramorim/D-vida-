import type { SearchResult } from './types'

export interface UnifiedOsintResult {
  id: string
  platform: string
  username: string
  displayName: string
  score: number
  url: string
  exists: boolean
  httpStatus: number
  status: 'found' | 'not_found' | 'error'
  source: string
  timestamp: number
  extra?: Record<string, unknown>
}

export interface OsintScanOptions {
  username: string
  useMaigret?: boolean
  useSherlock?: boolean
  useHttpChecker?: boolean
  timeout?: number
}

export function searchResultToUnified(result: SearchResult, source: string): UnifiedOsintResult {
  return {
    id: result.id,
    platform: result.platform,
    username: result.username,
    displayName: result.displayName,
    score: result.score ?? 0,
    url: result.url ?? '',
    exists: result.exists ?? false,
    httpStatus: result.httpStatus ?? 0,
    status: (result.status as 'found' | 'not_found' | 'error') ?? 'not_found',
    source,
    timestamp: result.timestamp ?? Date.now(),
    extra: result.extra,
  }
}

export function getScanStats(results: UnifiedOsintResult[]) {
  const found = results.filter(r => r.exists)
  const notFound = results.filter(r => !r.exists && r.status !== 'error')
  const errors = results.filter(r => r.status === 'error')

  const sources: Record<string, number> = {}
  for (const r of results) {
    sources[r.source] = (sources[r.source] ?? 0) + 1
  }

  const platforms = [...new Set(results.map(r => r.platform))]

  return {
    total: results.length,
    found: found.length,
    notFound: notFound.length,
    errors: errors.length,
    sources,
    platforms: platforms.length,
    foundPlatforms: found.map(r => r.platform)
  }
}
