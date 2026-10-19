import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('holeheResultToSearchResult', () => {
  it('deve importar e converter resultado existente', async () => {
    const { holeheResultToSearchResult } = await import('../lib/holehe.ts')
    const input = {
      email: 'test@example.com',
      site: 'instagram',
      exists: true,
      rate_limit: false,
    }
    const result = holeheResultToSearchResult(input)
    assert.equal(result.source, 'holehe')
    assert.equal(result.exists, true)
    assert.equal(result.platform, 'Instagram')
    assert.ok(result.id.startsWith('holehe-'))
    assert.ok(result.timestamp > 0)
  })

  it('deve converter resultado inexistente', async () => {
    const { holeheResultToSearchResult } = await import('../lib/holehe.ts')
    const input = {
      email: 'test@example.com',
      site: 'twitter',
      exists: false,
      rate_limit: false,
    }
    const result = holeheResultToSearchResult(input)
    assert.equal(result.exists, false)
    assert.equal(result.score, 10)
  })

  it('deve marcar rate limit corretamente', async () => {
    const { holeheResultToSearchResult } = await import('../lib/holehe.ts')
    const input = {
      email: 'test@example.com',
      site: 'facebook',
      exists: false,
      rate_limit: true,
    }
    const result = holeheResultToSearchResult(input)
    assert.equal(result.status, 'rate_limited')
  })
})

describe('maigretResultToSearchResult', () => {
  it('deve converter resultado maigret para SearchResult', async () => {
    const { maigretResultToSearchResult } = await import('../lib/maigret.ts')
    const result = maigretResultToSearchResult(
      {
        site: 'github',
        url: 'https://github.com/testuser',
        exists: true,
        status: 'claimed',
        http_status: 200,
        response_time: 150,
      },
      'testuser'
    )
    assert.equal(result.source, 'maigret')
    assert.equal(result.exists, true)
    assert.equal(result.username, 'testuser')
    assert.equal(result.platform, 'GitHub')
  })
})

describe('instaloaderResultToSearchResult', () => {
  it('deve converter perfil instagram para SearchResult', async () => {
    const { instagramProfileToSearchResult } = await import('../lib/instaloader.ts')
    const profile = {
      username: 'testuser',
      full_name: 'Test User',
      biography: 'Hello world',
      followers: 1500,
      following: 300,
      posts: 42,
      is_private: false,
      is_verified: true,
      profile_pic_url: 'https://example.com/pic.jpg',
      external_url: 'https://example.com',
    }
    const result = instagramProfileToSearchResult(profile)
    assert.equal(result.source, 'instaloader')
    assert.equal(result.exists, true)
    assert.equal(result.username, 'testuser')
    assert.equal(result.platform, 'Instagram')
    assert.equal(result.followers, '1.5K')
    assert.equal(result.posts, '42')
  })
})
