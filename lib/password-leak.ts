import { SearchResult } from './types';

export interface PasswordLeakResult {
  hash: string;
  prefix: string;
  suffix: string;
  count: number;
  found: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function classifyRisk(count: number): PasswordLeakResult['riskLevel'] {
  if (count === 0) return 'none';
  if (count < 10) return 'low';
  if (count < 1000) return 'medium';
  if (count < 100000) return 'high';
  return 'critical';
}

export async function checkPasswordLeak(password: string): Promise<PasswordLeakResult> {
  const hash = await sha1(password);
  const prefix = hash.substring(0, 5);
  const suffix = hash.substring(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'shandon-elite-password-checker',
      },
    });

    if (!response.ok) {
      return { hash, prefix, suffix, count: 0, found: false, riskLevel: 'none' };
    }

    const text = await response.text();
    const lines = text.split('\n');
    let count = 0;

    for (const line of lines) {
      const [hashSuffix, hashCount] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        count = parseInt(hashCount.trim(), 10);
        break;
      }
    }

    return {
      hash,
      prefix,
      suffix,
      count,
      found: count > 0,
      riskLevel: classifyRisk(count),
    };
  } catch {
    return { hash, prefix, suffix, count: 0, found: false, riskLevel: 'none' };
  }
}

export function passwordLeakToSearchResult(result: PasswordLeakResult, password: string): SearchResult {
  return {
    id: `password-leak-${result.hash.substring(0, 10)}`,
    platform: 'HIBP Passwords',
    username: password.substring(0, 3) + '***',
    displayName: `Password Leak Check`,
    score: result.found ? Math.min(100, Math.floor(Math.log10(result.count + 1) * 10)) : 0,
    exists: result.found,
    status: result.found ? `Found ${result.count.toLocaleString()} times` : 'Not found in breaches',
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      hash: result.hash,
      prefix: result.prefix,
      count: result.count,
      riskLevel: result.riskLevel,
    },
  };
}
