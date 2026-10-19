import { SearchResult } from './types';

export interface GpsCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

export interface ImageForensicsResult {
  url: string;
  hasExif: boolean;
  gps: GpsCoords | null;
  camera: {
    make: string;
    model: string;
    lens: string;
  };
  software: string;
  dates: {
    taken: string;
    modified: string;
    digitized: string;
  };
  metadata: Record<string, string>;
}

async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseExifFromHeaders(headers: Headers): Record<string, string> {
  const meta: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.startsWith('x-exif') || key.startsWith('x-meta')) {
      meta[key] = value;
    }
  });
  return meta;
}

function parseExifFromText(text: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      if (key && value && key.length < 50) {
        meta[key] = value;
      }
    }
  }
  return meta;
}

function extractGps(metadata: Record<string, string>): GpsCoords | null {
  const latKey = Object.keys(metadata).find(
    (k) => k.toLowerCase().includes('gps') && k.toLowerCase().includes('lat')
  );
  const lonKey = Object.keys(metadata).find(
    (k) => k.toLowerCase().includes('gps') && k.toLowerCase().includes('lon')
  );

  if (latKey && lonKey) {
    const lat = parseFloat(metadata[latKey]);
    const lon = parseFloat(metadata[lonKey]);
    if (!isNaN(lat) && !isNaN(lon)) {
      const altKey = Object.keys(metadata).find(
        (k) => k.toLowerCase().includes('gps') && k.toLowerCase().includes('alt')
      );
      return {
        latitude: lat,
        longitude: lon,
        altitude: altKey ? parseFloat(metadata[altKey]) || null : null,
      };
    }
  }

  const gpsStr = metadata['GPS Position'] || metadata['gps:latitude'] || '';
  if (gpsStr) {
    const match = gpsStr.match(/([\d.]+)[,\s]+([\d.]+)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
        altitude: null,
      };
    }
  }

  return null;
}

export async function analyzeImage(url: string): Promise<ImageForensicsResult> {
  const defaultResult: ImageForensicsResult = {
    url,
    hasExif: false,
    gps: null,
    camera: { make: '', model: '', lens: '' },
    software: '',
    dates: { taken: '', modified: '', digitized: '' },
    metadata: {},
  };

  try {
    const response = await fetchWithTimeout(url, 15000);

    if (!response.ok) {
      return defaultResult;
    }

    const contentType = response.headers.get('content-type') || '';

    const headerMeta = parseExifFromHeaders(response.headers);

    const buffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let metadata: Record<string, string> = { ...headerMeta };

    if (uint8[0] === 0xff && uint8[1] === 0xd8) {
      let offset = 2;
      while (offset < uint8.length - 1) {
        if (uint8[offset] !== 0xff) break;
        const marker = uint8[offset + 1];

        if (marker === 0xe1) {
          const segmentLength = (uint8[offset + 2] << 8) | uint8[offset + 3];
          const segmentData = uint8.slice(offset + 4, offset + 2 + segmentLength);
          const text = new TextDecoder('utf-8', { fatal: false }).decode(segmentData);

          if (text.includes('Exif')) {
            const exifText = text.replace(/\0/g, '\n');
            const parsed = parseExifFromText(exifText);
            metadata = { ...metadata, ...parsed };
          }
          offset += 2 + segmentLength;
        } else if (marker === 0xda) {
          break;
        } else {
          const segmentLength = (uint8[offset + 2] << 8) | uint8[offset + 3];
          offset += 2 + segmentLength;
        }
      }
    }

    const exifTools: Record<string, string> = {};
    for (const [key, val] of Object.entries(metadata)) {
      const lower = key.toLowerCase();
      if (lower.includes('make') || lower.includes('camera make')) exifTools.make = val;
      if (lower.includes('model') || lower.includes('camera model')) exifTools.model = val;
      if (lower.includes('lens')) exifTools.lens = val;
      if (lower.includes('software') || lower.includes('processing software')) exifTools.software = val;
      if (lower.includes('date') && lower.includes('original')) exifTools.taken = val;
      if (lower.includes('date') && lower.includes('modified')) exifTools.modified = val;
      if (lower.includes('date') && lower.includes('digitized')) exifTools.digitized = val;
    }

    const gps = extractGps(metadata);

    return {
      url,
      hasExif: Object.keys(metadata).length > 0,
      gps,
      camera: {
        make: exifTools.make || '',
        model: exifTools.model || '',
        lens: exifTools.lens || '',
      },
      software: exifTools.software || '',
      dates: {
        taken: exifTools.taken || '',
        modified: exifTools.modified || '',
        digitized: exifTools.digitized || '',
      },
      metadata,
    };
  } catch {
    return defaultResult;
  }
}

export function imageForensicsToSearchResult(result: ImageForensicsResult): SearchResult {
  const findings: string[] = [];
  if (result.hasExif) findings.push('EXIF data present');
  if (result.gps) findings.push(`GPS: ${result.gps.latitude}, ${result.gps.longitude}`);
  if (result.camera.make) findings.push(`Camera: ${result.camera.make} ${result.camera.model}`);
  if (result.software) findings.push(`Software: ${result.software}`);
  if (result.dates.taken) findings.push(`Taken: ${result.dates.taken}`);

  return {
    id: `imgforensics-${btoa(result.url).slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`,
    platform: 'Image Forensics',
    username: result.url,
    displayName: 'Image Forensic Analysis',
    score: findings.length * 20,
    exists: result.hasExif,
    status: findings.length > 0 ? findings.join(' | ') : 'No EXIF data found',
    url: result.url,
    source: 'image-forensics',
    timestamp: Date.now(),
    extra: {
      hasExif: result.hasExif,
      gps: result.gps,
      camera: result.camera,
      software: result.software,
      dates: result.dates,
      metadataKeys: Object.keys(result.metadata),
    },
  };
}
