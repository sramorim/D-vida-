/**
 * Instagram Session Cookie Management
 * 
 * Handles storage and validation of session cookies for authenticated access.
 * Cookies are stored in localStorage (client-side only) for security.
 */

export interface SessionData {
  cookie: string
  username: string
  createdAt: number
  lastValidated: number
  isValid: boolean
}

const STORAGE_KEY = 'shandon_ig_session'

/**
 * Save session cookie to localStorage
 */
export function saveSession(cookie: string, username: string): SessionData {
  const session: SessionData = {
    cookie,
    username,
    createdAt: Date.now(),
    lastValidated: Date.now(),
    isValid: true,
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }
  
  return session
}

/**
 * Get stored session from localStorage
 */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

/**
 * Clear stored session
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Check if session exists
 */
export function hasSession(): boolean {
  return getSession() !== null
}

/**
 * Validate session cookie by making a test request to Instagram
 */
export async function validateSession(cookie: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': '*/*',
        'Cookie': cookie,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return { valid: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    
    if (data.status === 'ok' && data.user) {
      return {
        valid: true,
        username: data.user.username,
      }
    }

    return { valid: false, error: 'Resposta inválida' }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Erro de conexão',
    }
  }
}

/**
 * Update session validation status
 */
export function markSessionValidated(username: string): void {
  const session = getSession()
  if (session) {
    session.lastValidated = Date.now()
    session.isValid = true
    session.username = username
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  }
}

/**
 * Mark session as invalid
 */
export function markSessionInvalid(): void {
  const session = getSession()
  if (session) {
    session.isValid = false
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  }
}
