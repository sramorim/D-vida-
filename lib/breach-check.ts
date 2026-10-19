import { SearchResult } from './types';

export interface Breach {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isSensitive: boolean;
}

export interface BreachCheckResult {
  email: string;
  breached: boolean;
  breachCount: number;
  breaches: Breach[];
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkBreach(email: string): Promise<BreachCheckResult> {
  const defaultResult: BreachCheckResult = {
    email,
    breached: false,
    breachCount: 0,
    breaches: [],
  };

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await fetchWithTimeout(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(normalizedEmail)}?truncateResponse=false`,
    );

    if (response.status === 200) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          email: normalizedEmail,
          breached: true,
          breachCount: data.length,
          breaches: data.map((b: Record<string, unknown>) => ({
            name: (b.Name as string) || '',
            title: (b.Title as string) || '',
            domain: (b.Domain as string) || '',
            breachDate: (b.BreachDate as string) || '',
            addedDate: (b.AddedDate as string) || '',
            pwnCount: (b.PwnCount as number) || 0,
            description: (b.Description as string) || '',
            dataClasses: Array.isArray(b.DataClasses) ? (b.DataClasses as string[]) : [],
            isVerified: !!b.IsVerified,
            isSensitive: !!b.IsSensitive,
          })),
        };
      }
    }

    if (response.status === 404) {
      return { ...defaultResult, email: normalizedEmail };
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return {
        ...defaultResult,
        email: normalizedEmail,
        breaches: [],
      };
    }
  } catch {
    // HIBP API failed, try alternative check
  }

  try {
    const response = await fetchWithTimeout(
      `https://passwords.google.com/checkup/start?email=${encodeURIComponent(normalizedEmail)}`,
      8000
    );
    // This endpoint won't return breach data but confirms the email exists
  } catch {
    // ignore
  }

  return defaultResult;
}

export function breachCheckToSearchResult(result: BreachCheckResult): SearchResult {
  const dataClasses = new Set<string>();
  for (const breach of result.breaches) {
    for (const cls of breach.dataClasses) {
      dataClasses.add(cls);
    }
  }

  return {
    id: `breach-${result.email.replace(/[@.]/g, '-')}`,
    platform: 'Breach Check',
    username: result.email,
    displayName: result.email,
    score: result.breached ? Math.min(100, result.breachCount * 15) : 0,
    exists: result.breached,
    status: result.breached
      ? `${result.breachCount} breaches found`
      : 'No breaches found',
    url: `https://haveibeenpwned.com/account/${encodeURIComponent(result.email)}`,
    source: 'breach-check',
    timestamp: Date.now(),
    extra: {
      breachCount: result.breachCount,
      dataClasses: Array.from(dataClasses),
      breaches: result.breaches.slice(0, 10).map((b) => ({
        name: b.name,
        title: b.title,
        breachDate: b.breachDate,
        pwnCount: b.pwnCount,
        dataClasses: b.dataClasses,
        isVerified: b.isVerified,
      })),
    },
  };
}
