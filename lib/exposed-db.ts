import { SearchResult } from './types';

export interface ExposedDb {
  type: string;
  port: number;
  response: string;
  version: string;
  risk: string;
}

export interface ExposedDbResult {
  target: string;
  databases: ExposedDb[];
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
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

async function checkFirebase(target: string): Promise<ExposedDb | null> {
  const hostname = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
  const baseUrl = `https://${hostname.replace(/\./g, '-')}.firebaseio.com`;

  try {
    const response = await fetchWithTimeout(`${baseUrl}/.json`, 5000);
    if (response.ok) {
      const text = await response.text();
      const isExposed = text !== 'null' && text.length > 2;
      return {
        type: 'Firebase Realtime Database',
        port: 443,
        response: isExposed ? 'EXPOSED - Data accessible' : 'Protected - null response',
        version: '',
        risk: isExposed ? 'CRITICAL' : 'LOW',
      };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        type: 'Firebase Realtime Database',
        port: 443,
        response: 'Protected - Authentication required',
        version: '',
        risk: 'LOW',
      };
    }
  } catch {
    // not a firebase or timeout
  }

  return null;
}

async function checkElasticsearch(target: string): Promise<ExposedDb | null> {
  const hostname = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
  const urls = [
    `http://${hostname}:9200`,
    `https://${hostname}:9200`,
  ];

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(`${url}/`, 5000);
      if (response.ok) {
        const data = await response.json();
        if (data.cluster_name || data.version) {
          const version = data.version?.number || 'unknown';
          return {
            type: 'Elasticsearch',
            port: 9200,
            response: `Cluster: ${data.cluster_name || 'N/A'}`,
            version,
            risk: 'HIGH',
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function checkMongoDb(target: string): Promise<ExposedDb | null> {
  const hostname = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const socket = await new Promise<globalThis.Response>((resolve, reject) => {
      fetch(`mongodb://${hostname}:27017/`, {
        signal: controller.signal,
      }).then(resolve).catch(reject);
    });

    clearTimeout(timeoutId);
    return {
      type: 'MongoDB',
      port: 27017,
      response: 'Port open - may be accessible',
      version: '',
      risk: 'HIGH',
    };
  } catch {
    // try HTTP endpoint some MongoDB setups expose
  }

  try {
    const response = await fetchWithTimeout(`http://${hostname}:27017/`, 3000);
    if (response.ok) {
      const text = await response.text();
      return {
        type: 'MongoDB',
        port: 27017,
        response: text.slice(0, 200) || 'Port open',
        version: '',
        risk: 'HIGH',
      };
    }
  } catch {
    // not accessible
  }

  return null;
}

async function checkRedis(target: string): Promise<ExposedDb | null> {
  const hostname = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

  try {
    const response = await fetchWithTimeout(`http://${hostname}:6379/`, 3000);
    if (response.ok) {
      const text = await response.text();
      return {
        type: 'Redis',
        port: 6379,
        response: text.slice(0, 200) || 'Port open',
        version: '',
        risk: 'CRITICAL',
      };
    }
  } catch {
    // not accessible via HTTP
  }

  // Redis responds with -ERR when connected via TCP
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch(`redis://${hostname}:6379`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    if (resp) {
      return {
        type: 'Redis',
        port: 6379,
        response: 'Port responding',
        version: '',
        risk: 'CRITICAL',
      };
    }
  } catch {
    // not accessible
  }

  return null;
}

export async function checkExposedDb(target: string): Promise<ExposedDbResult> {
  const cleanTarget = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

  const checks = await Promise.allSettled([
    checkFirebase(cleanTarget),
    checkElasticsearch(cleanTarget),
    checkMongoDb(cleanTarget),
    checkRedis(cleanTarget),
  ]);

  const databases: ExposedDb[] = [];
  for (const result of checks) {
    if (result.status === 'fulfilled' && result.value) {
      databases.push(result.value);
    }
  }

  let riskLevel: ExposedDbResult['riskLevel'] = 'none';
  if (databases.some((d) => d.risk === 'CRITICAL')) riskLevel = 'critical';
  else if (databases.some((d) => d.risk === 'HIGH')) riskLevel = 'high';
  else if (databases.some((d) => d.risk === 'MEDIUM')) riskLevel = 'medium';
  else if (databases.length > 0) riskLevel = 'low';

  return {
    target: cleanTarget,
    databases,
    riskLevel,
  };
}

export function exposedDbToSearchResult(result: ExposedDbResult): SearchResult {
  const dbList = result.databases.map((d) => d.type).join(', ');
  const riskScore: Record<string, number> = {
    critical: 100,
    high: 80,
    medium: 60,
    low: 30,
    none: 0,
  };

  return {
    id: `exposeddb-${result.target.replace(/[:.]/g, '-')}`,
    platform: 'Exposed DB',
    username: result.target,
    displayName: 'Exposed Database Check',
    score: riskScore[result.riskLevel] || 0,
    exists: result.databases.length > 0,
    status: result.databases.length > 0
      ? `${result.riskLevel.toUpperCase()}: ${dbList}`
      : 'No exposed databases detected',
    source: 'exposed-db',
    timestamp: Date.now(),
    extra: {
      riskLevel: result.riskLevel,
      databases: result.databases,
    },
  };
}
