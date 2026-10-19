import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  createSnapshot,
  getSnapshots,
  getLatestSnapshot,
  compareSnapshots,
  generateSnapshotId,
  computeImageHash,
} from '../lib/snapshot.ts'
import type { Snapshot, SnapshotPlatform } from '../lib/types.ts'
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = join(process.cwd(), 'data', 'snapshots', '_test')

/**
 * Os snapshots de teste são gravados por plataforma e username:
 * `data/snapshots/instagram/_test_user`, `.../facebook/_test_user`,
 * `.../instagram/_test_list`, `.../instagram/_test_latest`.
 *
 * A limpeza antiga só apagava `data/snapshots/_test`, que nenhum teste usa.
 * Resultado: cada execução da suíte deixava ~40 arquivos para trás, e o
 * diretório `data/` acumulava lixo até o em hundreds de arquivos.
 *
 * Aqui a limpeza remove qualquer username começando com `_test` em qualquer
 * plataforma, que é exatamente o que os testes criam.
 */
function cleanupTestDir() {
  const base = join(process.cwd(), 'data', 'snapshots')
  if (!existsSync(base)) return

  for (const plataforma of readdirSync(base)) {
    const dirPlataforma = join(base, plataforma)
    if (!statSync(dirPlataforma).isDirectory()) continue
    for (const username of readdirSync(dirPlataforma)) {
      if (!username.startsWith('_test')) continue
      rmSync(join(dirPlataforma, username), { recursive: true, force: true })
    }
  }

  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true })
  }
}

describe('generateSnapshotId', () => {
  it('deve gerar string não vazia', () => {
    const id = generateSnapshotId()
    assert.ok(id.length > 0)
  })

  it('deve gerar IDs únicos', () => {
    const id1 = generateSnapshotId()
    const id2 = generateSnapshotId()
    assert.notEqual(id1, id2)
  })
})

describe('computeImageHash', () => {
  it('deve retornar hash para URL válida', () => {
    const hash = computeImageHash('https://example.com/photo.jpg')
    assert.ok(hash)
    assert.ok(hash!.length > 0)
  })

  it('deve retornar null para null', () => {
    const hash = computeImageHash(null)
    assert.equal(hash, null)
  })

  it('deve gerar hash diferente para URLs diferentes', () => {
    const hash1 = computeImageHash('https://example.com/a.jpg')
    const hash2 = computeImageHash('https://example.com/b.jpg')
    assert.notEqual(hash1, hash2)
  })

  it('deve gerar hash igual para mesma URL', () => {
    const hash1 = computeImageHash('https://example.com/photo.jpg')
    const hash2 = computeImageHash('https://example.com/photo.jpg')
    assert.equal(hash1, hash2)
  })
})

describe('createSnapshot', () => {
  before(cleanupTestDir)
  after(cleanupTestDir)

  it('deve criar snapshot Instagram completo', () => {
    const snapshot = createSnapshot(
      'instagram',
      '_test_user',
      {
        username: '_test_user',
        full_name: 'Test User',
        bio: 'Test bio',
        profile_pic_url: 'https://example.com/pic.jpg',
        profile_pic_hash: null,
        followers_count: 1000,
        following_count: 500,
        posts_count: 50,
        is_verified: false,
        is_private: false,
        external_url: 'https://example.com',
        followers_sample: null,
        following_sample: null,
      },
      'instaloader',
      'complete'
    )

    assert.ok(snapshot.id)
    assert.equal(snapshot.platform, 'instagram')
    assert.equal(snapshot.username, '_test_user')
    assert.ok(snapshot.timestamp > 0)
    assert.equal(snapshot.provider, 'instaloader')
    assert.equal(snapshot.status, 'complete')
    assert.equal(snapshot.profile.username, '_test_user')
    assert.equal(snapshot.profile.full_name, 'Test User')
    assert.equal(snapshot.profile.bio, 'Test bio')
    assert.equal(snapshot.profile.followers_count, 1000)
    assert.equal(snapshot.profile.following_count, 500)
    assert.equal(snapshot.profile.posts_count, 50)
    assert.equal(snapshot.profile.is_verified, false)
    assert.equal(snapshot.profile.is_private, false)
    assert.ok(snapshot.profile.profile_pic_hash)
  })

  it('deve criar snapshot com dados parciais', () => {
    const snapshot = createSnapshot(
      'facebook',
      '_test_user',
      {
        username: '_test_user',
        full_name: null,
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: null,
        following_count: null,
        posts_count: null,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      'http-checker',
      'partial',
      'Dados limitados'
    )

    assert.equal(snapshot.platform, 'facebook')
    assert.equal(snapshot.status, 'partial')
    assert.equal(snapshot.error, 'Dados limitados')
    assert.equal(snapshot.profile.full_name, null)
    assert.equal(snapshot.profile.followers_count, null)
  })
})

describe('getSnapshots', () => {
  before(cleanupTestDir)
  after(cleanupTestDir)

  it('deve retornar vazio para username sem snapshots', () => {
    const snapshots = getSnapshots('instagram', 'naoexiste999xyz')
    assert.equal(snapshots.length, 0)
  })

  it('deve retornar snapshots criados', () => {
    createSnapshot(
      'instagram',
      '_test_list',
      {
        username: '_test_list',
        full_name: null,
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 100,
        following_count: 50,
        posts_count: 10,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      'test',
      'complete'
    )

    const snapshots = getSnapshots('instagram', '_test_list')
    assert.ok(snapshots.length >= 1)
    assert.equal(snapshots[0].username, '_test_list')
  })

  it('deve retornar snapshots ordenados por timestamp decrescente', () => {
    const snapshots = getSnapshots('instagram', '_test_list')
    for (let i = 1; i < snapshots.length; i++) {
      assert.ok(snapshots[i - 1].timestamp >= snapshots[i].timestamp)
    }
  })
})

describe('getLatestSnapshot', () => {
  before(cleanupTestDir)
  after(cleanupTestDir)

  it('deve retornar null para username sem snapshots', () => {
    const latest = getLatestSnapshot('instagram', 'naoexiste999xyz')
    assert.equal(latest, null)
  })

  it('deve retornar o snapshot mais recente', () => {
    createSnapshot(
      'instagram',
      '_test_latest',
      {
        username: '_test_latest',
        full_name: null,
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 200,
        following_count: 100,
        posts_count: 20,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      'test',
      'complete'
    )

    const latest = getLatestSnapshot('instagram', '_test_latest')
    assert.ok(latest)
    assert.equal(latest.username, '_test_latest')
  })
})

describe('compareSnapshots', () => {
  it('deve detectar mudança de seguidores', () => {
    const before: Snapshot = {
      id: 'before-1',
      platform: 'instagram',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: 'Test',
        bio: 'Bio',
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 1000,
        following_count: 500,
        posts_count: 50,
        is_verified: false,
        is_private: false,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after: Snapshot = {
      ...before,
      id: 'after-1',
      timestamp: Date.now(),
      profile: {
        ...before.profile,
        followers_count: 1200,
      },
    }

    const comparison = compareSnapshots(before, after)
    assert.ok(comparison.changed)

    const followersField = comparison.fields.find((f) => f.field === 'followers_count')
    assert.ok(followersField)
    assert.ok(followersField.changed)
    assert.equal(followersField.delta, 200)

    assert.ok(comparison.summary.some((s) => s.includes('Seguidores')))
  })

  it('deve detectar mudança de bio', () => {
    const before: Snapshot = {
      id: 'before-2',
      platform: 'instagram',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: 'Test',
        bio: 'Old bio',
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 1000,
        following_count: 500,
        posts_count: 50,
        is_verified: false,
        is_private: false,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after: Snapshot = {
      ...before,
      id: 'after-2',
      timestamp: Date.now(),
      profile: {
        ...before.profile,
        bio: 'New bio',
      },
    }

    const comparison = compareSnapshots(before, after)
    assert.ok(comparison.changed)
    assert.ok(comparison.summary.some((s) => s.includes('Bio foi alterada')))
  })

  it('deve detectar mudança de nome', () => {
    const before: Snapshot = {
      id: 'before-3',
      platform: 'facebook',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: 'Old Name',
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: null,
        following_count: null,
        posts_count: null,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after: Snapshot = {
      ...before,
      id: 'after-3',
      timestamp: Date.now(),
      profile: {
        ...before.profile,
        full_name: 'New Name',
      },
    }

    const comparison = compareSnapshots(before, after)
    assert.ok(comparison.changed)
    assert.ok(comparison.summary.some((s) => s.includes('Nome alterado')))
  })

  it('deve detectar mudança de foto', () => {
    const before: Snapshot = {
      id: 'before-4',
      platform: 'instagram',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: null,
        bio: null,
        profile_pic_url: 'https://example.com/old.jpg',
        profile_pic_hash: null,
        followers_count: null,
        following_count: null,
        posts_count: null,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after: Snapshot = {
      ...before,
      id: 'after-4',
      timestamp: Date.now(),
      profile: {
        ...before.profile,
        profile_pic_url: 'https://example.com/new.jpg',
      },
    }

    const comparison = compareSnapshots(before, after)
    assert.ok(comparison.changed)
    assert.ok(comparison.summary.some((s) => s.includes('Foto de perfil foi alterada')))
  })

  it('deve reportar sem alterações quando snapshots são iguais', () => {
    const base: Snapshot = {
      id: 'base',
      platform: 'instagram',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: 'Test',
        bio: 'Bio',
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 1000,
        following_count: 500,
        posts_count: 50,
        is_verified: false,
        is_private: false,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const same = { ...base, id: 'same', timestamp: Date.now() }

    const comparison = compareSnapshots(base, same)
    assert.equal(comparison.changed, false)
    assert.ok(comparison.summary.some((s) => s.includes('Nenhuma alteração detectada')))
  })

  it('deve calcular delta negativo corretamente', () => {
    const before: Snapshot = {
      id: 'before-neg',
      platform: 'instagram',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: null,
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: 2000,
        following_count: 500,
        posts_count: 100,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after: Snapshot = {
      ...before,
      id: 'after-neg',
      timestamp: Date.now(),
      profile: {
        ...before.profile,
        followers_count: 1800,
      },
    }

    const comparison = compareSnapshots(before, after)
    assert.ok(comparison.changed)

    const followersField = comparison.fields.find((f) => f.field === 'followers_count')
    assert.ok(followersField)
    assert.equal(followersField.delta, -200)
    assert.ok(comparison.summary.some((s) => s.includes('reduziu')))
  })

  it('deve retornar changed false quando apenas campos nulos mudam', () => {
    const before: Snapshot = {
      id: 'before-null',
      platform: 'facebook',
      username: 'testuser',
      timestamp: Date.now() - 86400000,
      profile: {
        username: 'testuser',
        full_name: null,
        bio: null,
        profile_pic_url: null,
        profile_pic_hash: null,
        followers_count: null,
        following_count: null,
        posts_count: null,
        is_verified: null,
        is_private: null,
        external_url: null,
        followers_sample: null,
        following_sample: null,
      },
      provider: 'test',
      status: 'complete',
    }

    const after = { ...before, id: 'after-null', timestamp: Date.now() }
    const comparison = compareSnapshots(before, after)
    assert.equal(comparison.changed, false)
  })
})
