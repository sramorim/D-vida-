/**
 * SHANDON ELITE — WhatsApp Lookup
 *
 * Consulta os dados públicos de um número no WhatsApp através da API
 * WhatsApp OSINT (RapidAPI). Cada endpoint é consultado de forma
 * independente (uma falha não derruba as demais).
 *
 * A chave NUNCA é exposta ao cliente: vive como secret no ambiente
 * (RAPIDAPI_WHATSAPP_KEY) e a requisição é feita a partir do servidor.
 */

const WHATSAPP_HOST = process.env.RAPIDAPI_WHATSAPP_HOST || 'whatsapp-osint.p.rapidapi.com';
const WHATSAPP_KEY = process.env.RAPIDAPI_WHATSAPP_KEY || '';
const BASE = `https://${WHATSAPP_HOST}`;

export interface WhatsAppLookupResult {
  phone: string;
  configured: boolean;
  photo?: { hasPhoto: boolean; image?: string | null };
  about?: Record<string, unknown> | null;
  business?: Record<string, unknown> | null;
  devices?: Record<string, unknown> | null;
  privacy?: Record<string, unknown> | null;
  full?: Record<string, unknown> | null;
  errors: string[];
}

export function sanitizePhone(raw: string): string {
  // Somente dígitos. O usuário informa o código do país (55 para Brasil).
  return String(raw || '').replace(/[^\d]/g, '');
}

async function rapids(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        'x-rapidapi-key': WHATSAPP_KEY,
        'x-rapidapi-host': WHATSAPP_HOST,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('Falha de autenticação na API (verifique RAPIDAPI_WHATSAPP_KEY)');
    }
    const text = (await res.text()).trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(timer);
  }
}

function parsePhoto(raw: unknown): { hasPhoto: boolean; image?: string | null } {
  if (typeof raw === 'string') {
    const lo = raw.toLowerCase();
    if (lo.includes('no profile picture') || lo.includes('no profile photo') || lo.includes('hidden')) {
      return { hasPhoto: false, image: null };
    }
    const b64 = raw.replace(/^data:image\/[a-z]+;base64,/, '');
    if (b64.length > 100) return { hasPhoto: true, image: 'data:image/jpeg;base64,' + b64 };
    return { hasPhoto: false, image: null };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const b64 = (obj.data || obj.image || obj.base64) as string | undefined;
    if (typeof b64 === 'string' && b64.replace(/^data:image\/[a-z]+;base64,/, '').length > 100) {
      return { hasPhoto: true, image: /^data:image\//i.test(b64) ? b64 : 'data:image/jpeg;base64,' + b64 };
    }
  }
  return { hasPhoto: false, image: null };
}

export async function lookupWhatsApp(rawPhone: string): Promise<WhatsAppLookupResult> {
  const phone = sanitizePhone(rawPhone);
  const errors: string[] = [];

  if (!phone || phone.length < 8) {
    throw new Error('Número inválido. Use o código do país (ex.: 554797876098).');
  }

  if (!WHATSAPP_KEY) {
    return {
      phone,
      configured: false,
      errors: ['Chave da API não configurada (RAPIDAPI_WHATSAPP_KEY).'],
    };
  }

  const result: WhatsAppLookupResult = { phone, configured: true, errors };

  const q = `?phone=${encodeURIComponent(phone)}`;

  const [photoRaw, aboutRaw, businessRaw, devicesRaw, fullRaw, privacyRaw] = await Promise.allSettled([
    rapids(`/wspic/b64${q}`),
    rapids(`/about${q}`),
    rapids('/bizos', 'POST', { phone }),
    rapids(`/devices${q}`),
    rapids(`/wspic/dck${q}`),
    rapids(`/privacy${q}`),
  ]);

  if (photoRaw.status === 'fulfilled') result.photo = parsePhoto(photoRaw.value);
  else errors.push('Foto de perfil: ' + (photoRaw.reason as Error).message);

  const setJson = (target: 'about' | 'business' | 'devices' | 'full' | 'privacy') =>
    (settled: PromiseSettledResult<unknown>) => {
      if (settled.status === 'fulfilled' && settled.value && typeof settled.value === 'object') {
        result[target] = settled.value as Record<string, unknown>;
      } else if (settled.status === 'rejected') {
        errors.push(target + ': ' + (settled.reason as Error).message);
      }
    };

  setJson('about')(aboutRaw);
  setJson('business')(businessRaw);
  setJson('devices')(devicesRaw);
  setJson('full')(fullRaw);
  setJson('privacy')(privacyRaw);

  return result;
}