interface RateLimitEntry {
  count: number
  resetTime: number
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export function createRateLimiter() {
  const store = new Map<string, RateLimitEntry>()

  let cleanupTimer: ReturnType<typeof setInterval> | null = null

  function startCleanup(intervalMs: number = 60000) {
    if (cleanupTimer) return
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (now > entry.resetTime) {
          store.delete(key)
        }
      }
    }, intervalMs)
    if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
      cleanupTimer.unref()
    }
  }

  function stopCleanup() {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }

  startCleanup()

  function check(
    clientIp: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now()
    const entry = store.get(clientIp)

    if (!entry || now > entry.resetTime) {
      store.set(clientIp, { count: 1, resetTime: now + config.windowMs })
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs }
    }

    if (entry.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime }
  }

  function getHeaders(result: RateLimitResult, maxRequests: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    }
  }

  function cleanup() {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  }

  function getStats() {
    return { storeSize: store.size }
  }

  return { check, getHeaders, cleanup, getStats, stopCleanup }
}

export const defaultLimiter = createRateLimiter()
