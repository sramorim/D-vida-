import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../lib/rate-limit-core.ts'

describe('createRateLimiter', () => {
  it('deve permitir primeira requisicao', () => {
    const limiter = createRateLimiter()
    const result = limiter.check('192.168.1.1', { windowMs: 60000, maxRequests: 10 })
    assert.equal(result.allowed, true)
    assert.equal(result.remaining, 9)
  })

  it('deve contar requisicoes corretamente', () => {
    const limiter = createRateLimiter()
    const cfg = { windowMs: 60000, maxRequests: 3 }
    limiter.check('10.0.0.1', cfg)
    limiter.check('10.0.0.1', cfg)
    const third = limiter.check('10.0.0.1', cfg)
    assert.equal(third.allowed, true)
    assert.equal(third.remaining, 0)
  })

  it('deve bloquear quando excede limite', () => {
    const limiter = createRateLimiter()
    const cfg = { windowMs: 60000, maxRequests: 2 }
    limiter.check('172.16.0.1', cfg)
    limiter.check('172.16.0.1', cfg)
    const blocked = limiter.check('172.16.0.1', cfg)
    assert.equal(blocked.allowed, false)
    assert.equal(blocked.remaining, 0)
  })

  it('deve isolar IPs diferentes', () => {
    const limiter = createRateLimiter()
    const cfg = { windowMs: 60000, maxRequests: 1 }
    limiter.check('1.1.1.1', cfg)
    const second = limiter.check('2.2.2.2', cfg)
    assert.equal(second.allowed, true)
  })

  it('deve gerar headers corretos', () => {
    const limiter = createRateLimiter()
    const result = { allowed: true, remaining: 25, resetTime: Date.now() + 60000 }
    const headers = limiter.getHeaders(result, 30)
    assert.equal(headers['X-RateLimit-Limit'], '30')
    assert.equal(headers['X-RateLimit-Remaining'], '25')
    assert.ok(headers['X-RateLimit-Reset'])
  })

  it('deve limpar entradas expiradas', async () => {
    const limiter = createRateLimiter()
    const cfg = { windowMs: 10, maxRequests: 10 }
    limiter.check('expired-ip', cfg)
    await new Promise((r) => setTimeout(r, 20))
    limiter.cleanup()
    const result = limiter.check('expired-ip', cfg)
    assert.equal(result.allowed, true)
    assert.equal(result.remaining, 9)
  })
})
