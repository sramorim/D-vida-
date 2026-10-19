import { SearchResult } from './types';

export interface IpIntelResult {
  ip: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  reverse: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  query: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function lookupIp(ip: string): Promise<IpIntelResult> {
  const defaultResult: IpIntelResult = {
    ip,
    country: '',
    region: '',
    city: '',
    lat: 0,
    lon: 0,
    timezone: '',
    isp: '',
    org: '',
    as: '',
    reverse: '',
    mobile: false,
    proxy: false,
    hosting: false,
    query: ip,
  };

  try {
    const response = await fetchWithTimeout(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting,query`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          ip: data.query || ip,
          country: data.country || '',
          region: data.regionName || '',
          city: data.city || '',
          lat: data.lat || 0,
          lon: data.lon || 0,
          timezone: data.timezone || '',
          isp: data.isp || '',
          org: data.org || '',
          as: data.as || '',
          reverse: data.reverse || '',
          mobile: !!data.mobile,
          proxy: !!data.proxy,
          hosting: !!data.hosting,
          query: data.query || ip,
        };
      }
    }
  } catch {
    // ip-api failed, try fallback
  }

  try {
    const response = await fetchWithTimeout(
      `https://ipinfo.io/${encodeURIComponent(ip)}/json`
    );

    if (response.ok) {
      const data = await response.json();
      const [lat, lon] = (data.loc || '0,0').split(',').map(Number);
      return {
        ip: data.ip || ip,
        country: data.country || '',
        region: data.region || '',
        city: data.city || '',
        lat: lat || 0,
        lon: lon || 0,
        timezone: data.timezone || '',
        isp: data.org || '',
        org: '',
        as: '',
        reverse: data.hostname || '',
        mobile: false,
        proxy: false,
        hosting: false,
        query: data.ip || ip,
      };
    }
  } catch {
    // both failed
  }

  return defaultResult;
}

export function ipIntelToSearchResult(result: IpIntelResult): SearchResult {
  const flags: string[] = [];
  if (result.proxy) flags.push('Proxy');
  if (result.mobile) flags.push('Mobile');
  if (result.hosting) flags.push('Hosting');

  return {
    id: `ip-${result.ip.replace(/[:.]/g, '-')}`,
    platform: 'IP Intelligence',
    username: result.ip,
    displayName: `IP ${result.ip}`,
    score: result.proxy || result.hosting ? 80 : 40,
    exists: true,
    status: flags.length > 0 ? flags.join(', ') : 'Clean',
    location: [result.city, result.region, result.country].filter(Boolean).join(', '),
    source: 'ip-intel',
    timestamp: Date.now(),
    extra: {
      country: result.country,
      region: result.region,
      city: result.city,
      lat: result.lat,
      lon: result.lon,
      timezone: result.timezone,
      isp: result.isp,
      org: result.org,
      as: result.as,
      reverse: result.reverse,
      mobile: result.mobile,
      proxy: result.proxy,
      hosting: result.hosting,
    },
  };
}
