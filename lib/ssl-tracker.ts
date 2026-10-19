import { SearchResult } from './types';

export interface SSLCertificate {
  id: number;
  issuer_ca_id: number;
  issuer_name: string;
  common_name: string;
  name_value: string;
  not_before: string;
  not_after: string;
  serial_number: string;
}

export interface SSLTimelineEntry {
  date: string;
  issuer: string;
  commonName: string;
  SAN: string;
}

export interface SSLResult {
  domain: string;
  totalCerts: number;
  uniqueSubdomains: string[];
  issuers: { name: string; count: number }[];
  timeline: SSLTimelineEntry[];
  latestExpiry: string | null;
  earliestIssue: string | null;
}

export async function trackSSL(domain: string): Promise<SSLResult> {
  const defaultResult: SSLResult = {
    domain,
    totalCerts: 0,
    uniqueSubdomains: [],
    issuers: [],
    timeline: [],
    latestExpiry: null,
    earliestIssue: null,
  };

  try {
    const response = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
      {
        headers: { 'User-Agent': 'shandon-elite-ssl-tracker' },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return defaultResult;
    }

    const data: SSLCertificate[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return defaultResult;
    }

    const subdomains = new Set<string>();
    const issuerCounts = new Map<string, number>();
    const timeline: SSLTimelineEntry[] = [];

    for (const cert of data) {
      const names = (cert.name_value || '').split('\n').map((n) => n.trim()).filter(Boolean);
      for (const name of names) {
        if (name.endsWith(`.${domain}`) || name === domain) {
          subdomains.add(name);
        }
      }

      const issuer = cert.issuer_name || 'Unknown';
      issuerCounts.set(issuer, (issuerCounts.get(issuer) || 0) + 1);

      timeline.push({
        date: cert.not_before || '',
        issuer: cert.issuer_name || '',
        commonName: cert.common_name || '',
        SAN: cert.name_value || '',
      });
    }

    timeline.sort((a, b) => a.date.localeCompare(b.date));

    const issuers = Array.from(issuerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      domain,
      totalCerts: data.length,
      uniqueSubdomains: Array.from(subdomains).sort(),
      issuers,
      timeline,
      latestExpiry: timeline.length > 0 ? timeline[timeline.length - 1].date : null,
      earliestIssue: timeline.length > 0 ? timeline[0].date : null,
    };
  } catch {
    return defaultResult;
  }
}

export function sslToSearchResult(result: SSLResult): SearchResult {
  return {
    id: `ssl-${result.domain.replace(/\./g, '-')}`,
    platform: 'SSL/CRT',
    username: result.domain,
    displayName: 'SSL Certificate Intelligence',
    score: result.totalCerts > 0 ? Math.min(100, result.totalCerts) : 0,
    exists: result.totalCerts > 0,
    status: result.totalCerts > 0
      ? `${result.totalCerts} certs, ${result.uniqueSubdomains.length} subdomains`
      : 'No certificates found',
    url: `https://crt.sh/?q=${encodeURIComponent(result.domain)}`,
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      totalCerts: result.totalCerts,
      uniqueSubdomains: result.uniqueSubdomains,
      issuers: result.issuers,
      timeline: result.timeline.slice(-10),
      latestExpiry: result.latestExpiry,
      earliestIssue: result.earliestIssue,
    },
  };
}
