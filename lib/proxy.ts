export interface ProxyConfig {
  url: string
  type: 'http' | 'https' | 'socks5'
  username?: string
  password?: string
}

export interface ProxyFetchOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

let activeProxy: ProxyConfig | null = null

export function setProxy(config: ProxyConfig | null): void {
  activeProxy = config
}

export function getProxy(): ProxyConfig | null {
  return activeProxy
}

export function getProxyFromEnv(): ProxyConfig | null {
  const proxyUrl =
    process.env.SHANDON_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY

  if (!proxyUrl) return null

  const url = new URL(proxyUrl)
  return {
    url: proxyUrl,
    type: url.protocol.replace(':', '') as ProxyConfig['type'],
    username: url.username || undefined,
    password: url.password || undefined,
  }
}

export async function fetchWithProxy(
  url: string,
  options: RequestInit & { proxy?: ProxyConfig | null } = {}
): Promise<Response> {
  const { proxy: optProxy, ...fetchOptions } = options
  const proxy = optProxy ?? activeProxy ?? getProxyFromEnv()

  if (!proxy) {
    return fetch(url, fetchOptions)
  }

  return fetch(url, fetchOptions)
}

export async function testProxy(proxy: ProxyConfig): Promise<{
  success: boolean
  ip?: string
  latency?: number
  error?: string
}> {
  const start = Date.now()
  try {
    const res = await fetchWithProxy('https://api.ipify.org?format=json', {
      proxy,
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return {
      success: true,
      ip: data.ip,
      latency: Date.now() - start,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      latency: Date.now() - start,
    }
  }
}

export function buildProxyEnvString(proxy: ProxyConfig): string {
  const auth = proxy.username && proxy.password
    ? `${proxy.username}:${proxy.password}@`
    : ''
  const host = new URL(proxy.url).hostname
  const port = new URL(proxy.url).port
  const url = `${proxy.type}://${auth}${host}${port ? `:${port}` : ''}`
  return url
}
