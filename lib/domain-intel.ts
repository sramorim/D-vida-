import { SearchResult } from './types';

export interface DnsRecord {
  type: string;
  name: string;
  data: string;
  ttl: number;
}

export interface DomainIntelResult {
  domain: string;
  registrar: string;
  creationDate: string;
  expirationDate: string;
  nameservers: string[];
  dnsRecords: DnsRecord[];
  technologies: string[];
  httpHeaders: Record<string, string>;
  sslInfo: {
    issuer: string;
    validFrom: string;
    validTo: string;
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
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

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'SRV', 'CAA'];

async function queryDns(domain: string): Promise<DnsRecord[]> {
  const records: DnsRecord[] = [];

  for (const type of DNS_TYPES) {
    try {
      const response = await fetchWithTimeout(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.Answer && Array.isArray(data.Answer)) {
          for (const ans of data.Answer) {
            records.push({
              type: type,
              name: ans.name || domain,
              data: ans.data || '',
              ttl: ans.TTL || 0,
            });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return records;
}

async function queryRdap(domain: string): Promise<{ registrar: string; creationDate: string; expirationDate: string; nameservers: string[] }> {
  try {
    const response = await fetchWithTimeout(
      `https://rdap.org/domain/${encodeURIComponent(domain)}`
    );
    if (response.ok) {
      const data = await response.json();
      let registrar = '';
      let creationDate = '';
      let expirationDate = '';
      const nameservers: string[] = [];

      if (data.events) {
        for (const evt of data.events) {
          if (evt.eventAction === 'registration') creationDate = evt.eventDate || '';
          if (evt.eventAction === 'expiration') expirationDate = evt.eventDate || '';
        }
      }

      if (data.status) {
        // domain is registered
      }

      if (data.entities) {
        for (const entity of data.entities) {
          if (entity.roles && entity.roles.includes('registrar')) {
            if (entity.vcardArray && entity.vcardArray[1]) {
              for (const field of entity.vcardArray[1]) {
                if (field[0] === 'fn') registrar = field[3] || '';
              }
            }
          }
        }
      }

      if (data.nameservers) {
        for (const ns of data.nameservers) {
          if (ns.ldhName) nameservers.push(ns.ldhName);
        }
      }

      return { registrar, creationDate, expirationDate, nameservers };
    }
  } catch {
    // rdap failed
  }
  return { registrar: '', creationDate: '', expirationDate: '', nameservers: [] };
}

async function checkHttpHeaders(domain: string): Promise<{ headers: Record<string, string>; technologies: string[] }> {
  const headers: Record<string, string> = {};
  const technologies: string[] = [];

  try {
    const response = await fetchWithTimeout(`https://${domain}`, 8000);
    if (response.ok) {
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const server = headers['server'] || '';
      if (server) technologies.push(`Server: ${server}`);
      if (headers['x-powered-by']) technologies.push(headers['x-powered-by']);
      if (headers['x-aspnet-version']) technologies.push(`ASP.NET ${headers['x-aspnet-version']}`);
      if (headers['x-generator']) technologies.push(headers['x-generator']);
      if (headers['cf-ray']) technologies.push('Cloudflare');
      if (headers['x-amz-cf-id']) technologies.push('AWS CloudFront');
      if (headers['x-fastly-request-id']) technologies.push('Fastly');
      if (headers['x-akamai-transformed']) technologies.push('Akamai');
      if (headers['via']) technologies.push(`CDN: ${headers['via']}`);
      if (headers['x-varnish']) technologies.push('Varnish');
      if (headers['x-drupal-cache']) technologies.push('Drupal');
      if (headers['x-magento']) technologies.push('Magento');
      if (headers['x-shopify-stage']) technologies.push('Shopify');
      if (headers['x-redirect-by']) technologies.push(headers['x-redirect-by']);
      if (headers['x-nginx-cache']) technologies.push('Nginx Cache');
    }
  } catch {
    // HTTP check failed
  }

  return { headers, technologies };
}

async function checkSsl(domain: string): Promise<{ issuer: string; validFrom: string; validTo: string }> {
  try {
    const response = await fetchWithTimeout(`https://${domain}`, 8000);
    if (response.ok) {
      // We can't directly access the SSL cert from fetch, but we can try crt.sh
    }
  } catch {
    // ignore
  }

  try {
    const response = await fetchWithTimeout(
      `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
      8000
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        return {
          issuer: latest.issuer_name || '',
          validFrom: latest.not_before || '',
          validTo: latest.not_after || '',
        };
      }
    }
  } catch {
    // ignore
  }

  return { issuer: '', validFrom: '', validTo: '' };
}

export async function reconDomain(domain: string): Promise<DomainIntelResult> {
  const cleanDomain = domain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '').toLowerCase();

  const [rdap, dnsRecords, httpInfo, sslInfo] = await Promise.all([
    queryRdap(cleanDomain),
    queryDns(cleanDomain),
    checkHttpHeaders(cleanDomain),
    checkSsl(cleanDomain),
  ]);

  return {
    domain: cleanDomain,
    registrar: rdap.registrar,
    creationDate: rdap.creationDate,
    expirationDate: rdap.expirationDate,
    nameservers: rdap.nameservers,
    dnsRecords,
    technologies: httpInfo.technologies,
    httpHeaders: httpInfo.headers,
    sslInfo,
  };
}

export function domainIntelToSearchResult(result: DomainIntelResult): SearchResult {
  const techList = result.technologies.join(', ');
  const age = result.creationDate
    ? Math.floor((Date.now() - new Date(result.creationDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return {
    id: `domain-${result.domain.replace(/\./g, '-')}`,
    platform: 'Domain Intel',
    username: result.domain,
    displayName: result.domain,
    score: age !== null ? Math.min(100, age * 5 + result.dnsRecords.length) : 30,
    exists: true,
    status: [
      result.registrar ? `Registrar: ${result.registrar}` : '',
      result.dnsRecords.length ? `${result.dnsRecords.length} DNS records` : '',
      techList || '',
    ].filter(Boolean).join(' | '),
    url: `https://${result.domain}`,
    source: 'domain-intel',
    timestamp: Date.now(),
    extra: {
      registrar: result.registrar,
      creationDate: result.creationDate,
      expirationDate: result.expirationDate,
      nameservers: result.nameservers,
      dnsRecordCount: result.dnsRecords.length,
      dnsRecords: result.dnsRecords.slice(0, 20),
      technologies: result.technologies,
      sslInfo: result.sslInfo,
    },
  };
}
