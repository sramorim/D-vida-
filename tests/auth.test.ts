import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateApiKey, extractApiKeyFromHeaders } from '../lib/auth-core.ts'

describe('validateApiKey', () => {
  it('deve autenticar quando não há chave configurada', () => {
    const result = validateApiKey(null, undefined)
    assert.equal(result.authenticated, true)
  })

  it('deve autenticar quando chave configurada é vazia', () => {
    const result = validateApiKey(null, '')
    assert.equal(result.authenticated, true)
  })

  it('deve rejeitar quando chave configurada mas não fornecida', () => {
    const result = validateApiKey(null, 'my-secret-key')
    assert.equal(result.authenticated, false)
    assert.ok(result.error)
  })

  it('deve autenticar com chave correta', () => {
    const result = validateApiKey('my-secret-key', 'my-secret-key')
    assert.equal(result.authenticated, true)
  })

  it('deve rejeitar chave incorreta', () => {
    const result = validateApiKey('wrong-key', 'my-secret-key')
    assert.equal(result.authenticated, false)
  })
})

describe('extractApiKeyFromHeaders', () => {
  it('deve extrair Bearer token', () => {
    const key = extractApiKeyFromHeaders('Bearer abc123', null, null)
    assert.equal(key, 'abc123')
  })

  it('deve extrair X-API-Key header', () => {
    const key = extractApiKeyFromHeaders(null, 'xyz789', null)
    assert.equal(key, 'xyz789')
  })

  it('deve extrair query key', () => {
    const key = extractApiKeyFromHeaders(null, null, 'query123')
    assert.equal(key, 'query123')
  })

  it('deve retornar null quando nada fornecido', () => {
    const key = extractApiKeyFromHeaders(null, null, null)
    assert.equal(key, null)
  })

  it('deve priorizar Bearer sobre X-API-Key', () => {
    const key = extractApiKeyFromHeaders('Bearer bearer-key', 'apikey-key', null)
    assert.equal(key, 'bearer-key')
  })
})
