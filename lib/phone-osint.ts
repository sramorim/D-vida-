import { SearchResult } from './types';

export interface SocialMediaProfile {
  platform: string;
  url: string;
  exists: boolean;
}

export interface PhoneOsintResult {
  phone: string;
  valid: boolean;
  country: string;
  carrier: string;
  lineType: string;
  whatsapp: boolean;
  socialMedia: SocialMediaProfile[];
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

function parsePhoneNumber(input: string): { digits: string; countryCode: string; nationalNumber: string } {
  const cleaned = input.replace(/[^\d+]/g, '');
  let digits = cleaned.replace(/^\+/, '');

  if (digits.startsWith('1') && digits.length >= 11) {
    return { digits, countryCode: '1', nationalNumber: digits.slice(1) };
  }
  if (digits.startsWith('44') && digits.length >= 12) {
    return { digits, countryCode: '44', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('55') && digits.length >= 13) {
    return { digits, countryCode: '55', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('91') && digits.length >= 12) {
    return { digits, countryCode: '91', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('86') && digits.length >= 13) {
    return { digits, countryCode: '86', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('33') && digits.length >= 11) {
    return { digits, countryCode: '33', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('49') && digits.length >= 12) {
    return { digits, countryCode: '49', nationalNumber: digits.slice(2) };
  }
  if (digits.startsWith('81') && digits.length >= 12) {
    return { digits, countryCode: '81', nationalNumber: digits.slice(2) };
  }

  return { digits, countryCode: '', nationalNumber: digits };
}

const COUNTRY_CODES: Record<string, string> = {
  '1': 'US/CA',
  '44': 'UK',
  '55': 'Brazil',
  '91': 'India',
  '86': 'China',
  '33': 'France',
  '49': 'Germany',
  '81': 'Japan',
  '82': 'South Korea',
  '34': 'Spain',
  '39': 'Italy',
  '61': 'Australia',
  '7': 'Russia',
  '27': 'South Africa',
  '52': 'Mexico',
  '46': 'Sweden',
  '47': 'Norway',
  '45': 'Denmark',
  '358': 'Finland',
  '48': 'Poland',
  '420': 'Czech Republic',
  '36': 'Hungary',
  '40': 'Romania',
  '90': 'Turkey',
  '20': 'Egypt',
  '966': 'Saudi Arabia',
  '971': 'UAE',
  '972': 'Israel',
  '65': 'Singapore',
  '60': 'Malaysia',
  '62': 'Indonesia',
  '63': 'Philippines',
  '66': 'Thailand',
  '84': 'Vietnam',
};

async function checkNumverify(phone: string): Promise<{ carrier: string; lineType: string; country: string }> {
  try {
    const cleaned = phone.replace(/[^\d]/g, '');
    const response = await fetchWithTimeout(
      `http://apilayer.net/api/validate?access_key=demo&number=${cleaned}&country_code=&format=1`,
      8000
    );
    if (response.ok) {
      const data = await response.json();
      if (data.valid !== undefined) {
        return {
          carrier: data.carrier || '',
          lineType: data.line_type || '',
          country: data.country_name || '',
        };
      }
    }
  } catch {
    // numverify failed
  }
  return { carrier: '', lineType: '', country: '' };
}

async function checkWhatsApp(phone: string): Promise<boolean> {
  const cleaned = phone.replace(/[^\d]/g, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://wa.me/${cleaned}`, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeoutId);
    return response.status === 200 || response.status === 302;
  } catch {
    return false;
  }
}

async function checkSocialMedia(phone: string): Promise<SocialMediaProfile[]> {
  const profiles: SocialMediaProfile[] = [];
  const cleaned = phone.replace(/[^\d]/g, '');

  try {
    const response = await fetchWithTimeout(
      `https://api.telegram.org/bot${cleaned}/getMe`,
      3000
    );
    profiles.push({
      platform: 'Telegram',
      url: `https://t.me/${cleaned}`,
      exists: response.ok,
    });
  } catch {
    profiles.push({
      platform: 'Telegram',
      url: `https://t.me/${cleaned}`,
      exists: false,
    });
  }

  return profiles;
}

export async function analyzePhone(phone: string): Promise<PhoneOsintResult> {
  const { digits, countryCode } = parsePhoneNumber(phone);
  const country = COUNTRY_CODES[countryCode] || 'Unknown';

  const [numverify, whatsapp, socialMedia] = await Promise.all([
    checkNumverify(digits),
    checkWhatsApp(digits),
    checkSocialMedia(digits),
  ]);

  const valid = digits.length >= 7 && digits.length <= 15;

  return {
    phone: phone.trim(),
    valid,
    country: numverify.country || country,
    carrier: numverify.carrier,
    lineType: numverify.lineType,
    whatsapp,
    socialMedia,
  };
}

export function phoneOsintToSearchResult(result: PhoneOsintResult): SearchResult {
  const flags: string[] = [];
  if (result.whatsapp) flags.push('WhatsApp');
  if (result.carrier) flags.push(`Carrier: ${result.carrier}`);
  if (result.lineType) flags.push(`Type: ${result.lineType}`);
  for (const sm of result.socialMedia) {
    if (sm.exists) flags.push(sm.platform);
  }

  return {
    id: `phone-${result.phone.replace(/[^\d]/g, '')}`,
    platform: 'Phone OSINT',
    username: result.phone,
    displayName: result.phone,
    score: result.valid ? 50 + (flags.length * 10) : 0,
    exists: result.valid,
    status: result.valid
      ? [result.country, ...flags].filter(Boolean).join(' | ')
      : 'Invalid number',
    source: 'phone-osint',
    timestamp: Date.now(),
    extra: {
      valid: result.valid,
      country: result.country,
      carrier: result.carrier,
      lineType: result.lineType,
      whatsapp: result.whatsapp,
      socialMedia: result.socialMedia,
    },
  };
}
