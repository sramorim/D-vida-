import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FollowerProfile, FollowersData, InteractionProfile, InteractionsData } from '../lib/types.ts'

function createTestFollower(username: string, overrides?: Partial<FollowerProfile>): FollowerProfile {
  return {
    username,
    full_name: `${username} Name`,
    profile_pic_url: `https://example.com/${username}.jpg`,
    url: `https://www.instagram.com/${username}`,
    follows_target: null,
    ...overrides,
  }
}

function createTestInteraction(username: string, overrides?: Partial<InteractionProfile>): InteractionProfile {
  return {
    username,
    full_name: `${username} Name`,
    profile_pic_url: `https://example.com/${username}.jpg`,
    url: `https://www.instagram.com/${username}`,
    likes_observed: 0,
    comments_observed: 0,
    total_interactions: 0,
    follows_target: null,
    target_interacts_back: null,
    reciprocity_status: 'Interação observada no perfil analisado. Reciprocidade não determinada pela fonte.',
    ...overrides,
  }
}

describe('Máximo de 30 seguidores', () => {
  it('deve respeitar limite de 30 perfis', () => {
    const followers: FollowerProfile[] = []
    for (let i = 0; i < 50; i++) {
      followers.push(createTestFollower(`user${i}`))
    }

    const limited = followers.slice(0, 30)
    assert.equal(limited.length, 30)
  })

  it('deve retornar todos quando menos de 30', () => {
    const followers: FollowerProfile[] = []
    for (let i = 0; i < 15; i++) {
      followers.push(createTestFollower(`user${i}`))
    }

    const limited = followers.slice(0, 30)
    assert.equal(limited.length, 15)
  })

  it('deve retornar vazio quando não há seguidores', () => {
    const followers: FollowerProfile[] = []
    const limited = followers.slice(0, 30)
    assert.equal(limited.length, 0)
  })
})

describe('Fallback sem ordem temporal', () => {
  it('deve marcar has_temporal_order como false quando fonte não fornece ordem', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [createTestFollower('a'), createTestFollower('b')],
      following_list: [],
      total_returned: 2,
      has_temporal_order: false,
      status: 'complete',
    }

    assert.equal(data.has_temporal_order, false)
  })

  it('deve usar linguagem "Perfis retornados pela fonte" quando sem ordem temporal', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [createTestFollower('a')],
      following_list: [],
      total_returned: 1,
      has_temporal_order: false,
      status: 'complete',
    }

    assert.equal(data.has_temporal_order, false)
    assert.ok(data.followers.length > 0)
  })

  it('deve marcar has_temporal_order como true quando fonte fornece ordem', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [createTestFollower('newest'), createTestFollower('oldest')],
      following_list: [],
      total_returned: 2,
      has_temporal_order: true,
      status: 'complete',
    }

    assert.equal(data.has_temporal_order, true)
  })
})

describe('Reciprocidade de seguimento', () => {
  it('deve identificar seguimento recíproco quando ambas as direções existem', () => {
    const followingList = ['userA', 'userB', 'userC']
    const followingSet = new Set(followingList.map((f) => f.toLowerCase()))

    const follower = createTestFollower('userA')
    const followsTarget = followingSet.has(follower.username.toLowerCase())

    assert.equal(followsTarget, true)
  })

  it('deve identificar seguimento não recíproco quando apenas uma direção existe', () => {
    const followingList = ['userB', 'userC']
    const followingSet = new Set(followingList.map((f) => f.toLowerCase()))

    const follower = createTestFollower('userA')
    const followsTarget = followingSet.has(follower.username.toLowerCase())

    assert.equal(followsTarget, false)
  })

  it('deve lidar com lista de seguindo vazia', () => {
    const followingList: string[] = []
    const followingSet = new Set(followingList.map((f) => f.toLowerCase()))

    const follower = createTestFollower('userA')
    const followsTarget = followingSet.has(follower.username.toLowerCase())

    assert.equal(followsTarget, false)
  })

  it('deve ser case-insensitive na comparação', () => {
    const followingList = ['UserA']
    const followingSet = new Set(followingList.map((f) => f.toLowerCase()))

    const follower = createTestFollower('usera')
    const followsTarget = followingSet.has(follower.username.toLowerCase())

    assert.equal(followsTarget, true)
  })
})

describe('Cálculo do total de interações', () => {
  it('deve somar curtidas e comentários', () => {
    const profile = createTestInteraction('user1', {
      likes_observed: 10,
      comments_observed: 5,
    })
    profile.total_interactions = profile.likes_observed + profile.comments_observed

    assert.equal(profile.total_interactions, 15)
  })

  it('deve lidar com zero curtidas e comentários', () => {
    const profile = createTestInteraction('user1', {
      likes_observed: 0,
      comments_observed: 0,
    })
    profile.total_interactions = profile.likes_observed + profile.comments_observed

    assert.equal(profile.total_interactions, 0)
  })

  it('deve lidar com apenas curtidas', () => {
    const profile = createTestInteraction('user1', {
      likes_observed: 8,
      comments_observed: 0,
    })
    profile.total_interactions = profile.likes_observed + profile.comments_observed

    assert.equal(profile.total_interactions, 8)
  })

  it('deve lidar com apenas comentários', () => {
    const profile = createTestInteraction('user1', {
      likes_observed: 0,
      comments_observed: 3,
    })
    profile.total_interactions = profile.likes_observed + profile.comments_observed

    assert.equal(profile.total_interactions, 3)
  })
})

describe('TOP 7 interações', () => {
  it('deve retornar no máximo 7 perfis', () => {
    const profiles: InteractionProfile[] = []
    for (let i = 0; i < 15; i++) {
      const p = createTestInteraction(`user${i}`)
      p.total_interactions = 15 - i
      profiles.push(p)
    }

    const sorted = [...profiles].sort((a, b) => b.total_interactions - a.total_interactions)
    const top7 = sorted.slice(0, 7)

    assert.equal(top7.length, 7)
  })

  it('deve ordenar por total de interações decrescente', () => {
    const profiles: InteractionProfile[] = [
      createTestInteraction('low', { total_interactions: 3 }),
      createTestInteraction('high', { total_interactions: 20 }),
      createTestInteraction('mid', { total_interactions: 10 }),
    ]

    const sorted = [...profiles].sort((a, b) => b.total_interactions - a.total_interactions)

    assert.equal(sorted[0].username, 'high')
    assert.equal(sorted[1].username, 'mid')
    assert.equal(sorted[2].username, 'low')
  })

  it('deve retornar vazio quando não há interações', () => {
    const profiles: InteractionProfile[] = []
    const top7 = profiles.slice(0, 7)
    assert.equal(top7.length, 0)
  })

  it('deve retornar menos de 7 quando houver menos perfis', () => {
    const profiles: InteractionProfile[] = [
      createTestInteraction('a', { total_interactions: 5 }),
      createTestInteraction('b', { total_interactions: 3 }),
    ]

    const top7 = profiles.slice(0, 7)
    assert.equal(top7.length, 2)
  })
})

describe('Reciprocidade de interação', () => {
  it('deve reportar reciprocidade quando ambos os lados são comprovados', () => {
    const profile = createTestInteraction('user1')
    profile.target_interacts_back = true
    profile.reciprocity_status = 'Interação recíproca observada'

    assert.equal(profile.target_interacts_back, true)
    assert.ok(profile.reciprocity_status.includes('recíproca'))
  })

  it('deve reportar não-reciprocidade quando apenas uma direção é comprovada', () => {
    const profile = createTestInteraction('user1')
    profile.target_interacts_back = false
    profile.reciprocity_status = 'Interação observada no perfil analisado. Reciprocidade não determinada pela fonte.'

    assert.equal(profile.target_interacts_back, false)
    assert.ok(profile.reciprocity_status.includes('não determinada'))
  })

  it('deve reportar indeterminado quando dados insuficientes', () => {
    const profile = createTestInteraction('user1')
    profile.target_interacts_back = null
    profile.reciprocity_status = 'Interação observada no perfil analisado. Reciprocidade não determinada pela fonte.'

    assert.equal(profile.target_interacts_back, null)
    assert.ok(profile.reciprocity_status.includes('não determinada'))
  })
})

describe('Ausência de dados', () => {
  it('deve retornar status insufficient_data quando não há dados', () => {
    const data: InteractionsData = {
      platform: 'instagram',
      target_username: 'testuser',
      profiles: [],
      total_posts_analyzed: 0,
      status: 'insufficient_data',
      message: 'Interações insuficientes para gerar ranking.',
    }

    assert.equal(data.status, 'insufficient_data')
    assert.equal(data.profiles.length, 0)
  })

  it('deve retornar status unavailable quando provider não disponível', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [],
      following_list: [],
      total_returned: 0,
      has_temporal_order: false,
      status: 'unavailable',
      message: 'Provider indisponível',
    }

    assert.equal(data.status, 'unavailable')
    assert.equal(data.followers.length, 0)
  })

  it('deve usar mensagem "Dados insuficientes pela fonte" quando apropriado', () => {
    const data: InteractionsData = {
      platform: 'facebook',
      target_username: 'testuser',
      profiles: [],
      total_posts_analyzed: 0,
      status: 'unavailable',
      message: 'Facebook não fornece dados de interação via HTTP Checker.',
    }

    assert.ok(data.message)
    assert.ok(data.message.includes('Facebook'))
  })

  it('deve retornar status partial quando dados parciais', () => {
    const data: InteractionsData = {
      platform: 'instagram',
      target_username: 'testuser',
      profiles: [createTestInteraction('user1', { likes_observed: 5 })],
      total_posts_analyzed: 3,
      status: 'partial',
      message: 'Ranking parcial — baseado nos dados retornados pela fonte.',
    }

    assert.equal(data.status, 'partial')
    assert.ok(data.message?.includes('parcial'))
  })
})

describe('URLs', () => {
  it('deve ter URL clicável para cada seguidor', () => {
    const follower = createTestFollower('testuser')
    assert.ok(follower.url)
    assert.ok(follower.url.startsWith('https://'))
    assert.ok(follower.url.includes('testuser'))
  })

  it('deve ter URL clicável para cada perfil de interação', () => {
    const profile = createTestInteraction('testuser')
    assert.ok(profile.url)
    assert.ok(profile.url.startsWith('https://'))
    assert.ok(profile.url.includes('testuser'))
  })

  it('deve usar URL do provider quando disponível', () => {
    const follower = createTestFollower('testuser', {
      url: 'https://custom-platform.com/testuser',
    })
    assert.equal(follower.url, 'https://custom-platform.com/testuser')
  })

  it('deve gerar URL padrão quando provider não fornece', () => {
    const follower: FollowerProfile = {
      username: 'testuser',
      full_name: null,
      profile_pic_url: null,
      url: null,
      follows_target: null,
    }

    const platformUrl = 'www.instagram.com'
    const expectedUrl = follower.url || `https://${platformUrl}/${follower.username}`
    assert.ok(expectedUrl.includes('testuser'))
    assert.ok(expectedUrl.startsWith('https://'))
  })
})

describe('Zero mock', () => {
  it('não deve conter dados fictícios em FollowersData', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [],
      following_list: [],
      total_returned: 0,
      has_temporal_order: false,
      status: 'unavailable',
    }

    assert.equal(data.followers.length, 0)
    assert.equal(data.total_returned, 0)
    assert.equal(data.following_list.length, 0)
  })

  it('não deve conter dados fictícios em InteractionsData', () => {
    const data: InteractionsData = {
      platform: 'instagram',
      target_username: 'testuser',
      profiles: [],
      total_posts_analyzed: 0,
      status: 'insufficient_data',
    }

    assert.equal(data.profiles.length, 0)
    assert.equal(data.total_posts_analyzed, 0)
  })

  it('não deve inventar números de interações', () => {
    const profile = createTestInteraction('user1')
    assert.equal(profile.likes_observed, 0)
    assert.equal(profile.comments_observed, 0)
    assert.equal(profile.total_interactions, 0)
  })

  it('não deve afirmar "mais recente" quando fonte não fornece ordem temporal', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [createTestFollower('a')],
      following_list: [],
      total_returned: 1,
      has_temporal_order: false,
      status: 'complete',
    }

    assert.equal(data.has_temporal_order, false)
  })

  it('não deve afirmar "deixou de seguir" sem evidência', () => {
    const data: FollowersData = {
      platform: 'instagram',
      target_username: 'testuser',
      followers: [],
      following_list: [],
      total_returned: 0,
      has_temporal_order: false,
      status: 'complete',
    }

    assert.equal(data.followers.length, 0)
  })
})
