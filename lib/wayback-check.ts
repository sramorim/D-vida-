import { SearchResult } from './types';

export interface WaybackSnapshot {
  timestamp: string;
  url: string;
  statuscode: string;
  mimetype: string;
}

export interface WaybackResult {
  url: string;
  hasArchives: boolean;
  snapshotCount: number;
  oldestSnapshot: string | null;
  newestSnapshot: string | null;
  snapshots: WaybackSnapshot[];
}

export async function checkWayback(url: string): Promise<WaybackResult> {
  const defaultResult: WaybackResult = {
    url,
    hasArchives: false,
    snapshotCount: 0,
    oldestSnapshot: null,
    newestSnapshot: null,
    snapshots: [],
  };

  try {
    const response = await fetch(
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=1000&fl=timestamp,original,statuscode,mimetype`,
      {
        headers: { 'User-Agent': 'shandon-elite-wayback-checker' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return defaultResult;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length <= 1) {
      return defaultResult;
    }

    const headers = data[0] as string[];
    const rows = data.slice(1) as string[][];

    const snapshots: WaybackSnapshot[] = rows.map((row) => ({
      timestamp: row[headers.indexOf('timestamp')],
      url: row[headers.indexOf('original')],
      statuscode: row[headers.indexOf('statuscode')],
      mimetype: row[headers.indexOf('mimetype')],
    }));

    const timestamps = snapshots.map((s) => s.timestamp).sort();

    return {
      url,
      hasArchives: snapshots.length > 0,
      snapshotCount: snapshots.length,
      oldestSnapshot: timestamps[0] || null,
      newestSnapshot: timestamps[timestamps.length - 1] || null,
      snapshots,
    };
  } catch {
    return defaultResult;
  }
}

export function waybackToSearchResult(result: WaybackResult): SearchResult {
  const oldestDate = result.oldestSnapshot
    ? `${result.oldestSnapshot.substring(0, 4)}-${result.oldestSnapshot.substring(4, 6)}-${result.oldestSnapshot.substring(6, 8)}`
    : null;
  const newestDate = result.newestSnapshot
    ? `${result.newestSnapshot.substring(0, 4)}-${result.newestSnapshot.substring(4, 6)}-${result.newestSnapshot.substring(6, 8)}`
    : null;

  return {
    id: `wayback-${encodeURIComponent(result.url).substring(0, 50)}`,
    platform: 'Wayback Machine',
    username: result.url,
    displayName: 'Internet Archive',
    score: result.hasArchives ? Math.min(100, result.snapshotCount) : 0,
    exists: result.hasArchives,
    status: result.hasArchives
      ? `${result.snapshotCount} snapshots (${oldestDate} to ${newestDate})`
      : 'No archives found',
    url: result.hasArchives ? `https://web.archive.org/web/*/${result.url}` : undefined,
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      snapshotCount: result.snapshotCount,
      oldestSnapshot: result.oldestSnapshot,
      newestSnapshot: result.newestSnapshot,
      oldestDate,
      newestDate,
    },
  };
}
