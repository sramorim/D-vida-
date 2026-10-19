export interface AuthResult {
  authenticated: boolean
  error?: string
}

export function validateApiKey(
  providedKey: string | null,
  configuredKey: string | undefined | null
): AuthResult {
  if (!configuredKey || configuredKey.trim() === '') {
    return { authenticated: true }
  }

  if (!providedKey) {
    return {
      authenticated: false,
      error: 'Chave de API não fornecida. Use Authorization: Bearer <key> ou header X-API-Key.',
    }
  }

  if (providedKey.trim() !== configuredKey) {
    return {
      authenticated: false,
      error: 'Chave de API inválida.',
    }
  }

  return { authenticated: true }
}

export function extractApiKeyFromHeaders(
  authHeader: string | null,
  apiKeyHeader: string | null,
  queryKey: string | null
): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  if (apiKeyHeader) {
    return apiKeyHeader.trim()
  }
  if (queryKey) {
    return queryKey
  }
  return null
}
