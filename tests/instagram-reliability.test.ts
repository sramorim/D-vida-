/**
 * Confiabilidade da consulta de perfil no Instagram.
 *
 * Regressão do defeito original: o perfil público "sr__amorim" aparecia como
 * "Não encontrado" com score 5. A causa era dupla:
 *
 *  1) O http-checker usava `exists = status === 200`. O Instagram bloqueia
 *     requisição de datacenter (403/429) e a conexão às vezes morre, então o
 *     bloqueio virava "perfil não existe" — com o mesmo peso de um perfil
 *     inexistente de verdade.
 *
 *  2) A normalização de "@" era feita de forma diferente em cada camada
 *     (`replace('@','')` tira só a primeira ocorrência e não limpa espaço),
 *     então o mesmo texto chegava em formatos diferentes conforme o motor.
 *
 * Estes testes travam os dois pontos, mais a distinção entre os desfechos.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('normalizeUsername', () => {
  it('aceita com e sem @ e devolve sempre o mesmo username', async () => {
    const { normalizeUsername } = await import('../lib/username-normalize.ts')
    const esperado = 'sr__amorim'
    for (const entrada of [
      'sr__amorim',
      '@sr__amorim',
      '  @sr__amorim  ',
      'sr__amorim  ',
      '   sr__amorim',
      '@@sr__amorim',
      'https://instagram.com/sr__amorim',
      'https://www.instagram.com/sr__amorim/',
    ]) {
      const r = normalizeUsername(entrada)
      assert.equal(r.ok, true, `deveria aceitar: "${entrada}" (motivo: ${r.error})`)
      assert.equal(r.username, esperado, `"${entrada}" deveria virar "${esperado}"`)
    }
  })

  it('recusa entrada inválida com motivo claro', async () => {
    const { normalizeUsername } = await import('../lib/username-normalize.ts')
    assert.equal(normalizeUsername('').ok, false)
    assert.equal(normalizeUsername('   ').ok, false)
    assert.equal(normalizeUsername('@').ok, false)
    assert.equal(normalizeUsername('a').ok, false, 'menos de 2 caracteres')
    assert.equal(normalizeUsername('a'.repeat(31)).ok, false, 'mais de 30 caracteres')
    assert.equal(normalizeUsername('user name').ok, false, 'espaço no meio')
    assert.equal(normalizeUsername('user/name').ok, false, 'barra')
    assert.equal(normalizeUsername(undefined).ok, false)
    assert.equal(normalizeUsername(123).ok, false)
    assert.match(normalizeUsername('').error, /Informe|curto/i)
  })

  it('aceita ponto, sublinhado e números', async () => {
    const { normalizeUsername } = await import('../lib/username-normalize.ts')
    assert.equal(normalizeUsername('daniel.amorim_99').username, 'daniel.amorim_99')
  })
})

describe('classifySite — bloqueio nunca vira "não encontrado"', () => {
  it('403 do Instagram é "possible", não "not_found"', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 403 })
    assert.equal(r.verdict, 'possible')
    assert.equal(r.exists, false, 'bloqueio não confirma existência')
    assert.equal(r.uiStatus, 'possible')
    assert.notEqual(r.uiStatus, 'not_found')
    assert.match(r.message, /bloqueia consultas automáticas/)
    assert.equal(r.score, 55)
  })

  it('429 vira rate limit, não ausência', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 429 })
    assert.equal(r.verdict, 'possible')
    assert.match(r.message, /limitou o número de consultas|rate limit/i)
  })

  it('401 é erro de permissão, não ausência', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 401 })
    assert.equal(r.verdict, 'possible')
    assert.match(r.message, /401/)
  })

  it('timeout (status 0) é indisponível, não ausência', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 0 })
    assert.equal(r.verdict, 'unavailable')
    assert.equal(r.uiStatus, 'unavailable')
    assert.match(r.message, /tempo limite|rede/i)
  })

  it('5xx é indisponível, não ausência', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 503 })
    assert.equal(r.verdict, 'unavailable')
    assert.match(r.message, /fora do ar/)
  })

  it('só 404 (ou corpo dizendo que não existe) prova ausência', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({ site: 'Instagram', httpStatus: 404 })
    assert.equal(r.verdict, 'not_found')
    assert.equal(r.score, 0)

    const porCorpo = classifySite({
      site: 'GitHub', httpStatus: 200, bodySaysNotFound: true,
    })
    assert.equal(porCorpo.verdict, 'not_found')
  })

  it('200 sem dados de perfil é "possible" (muro de bloqueio), não achado', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({
      site: 'Instagram', httpStatus: 200, contentLooksLikeProfile: false,
    })
    assert.equal(r.verdict, 'possible')
    assert.equal(r.exists, false)
  })

  it('200 com dados de perfil é achado', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    const r = classifySite({
      site: 'GitHub', httpStatus: 200, contentLooksLikeProfile: true,
    })
    assert.equal(r.verdict, 'found')
    assert.equal(r.exists, true)
    assert.equal(r.uiStatus, 'found')
  })

  it('nenhum desfecho vira "Não encontrado" sem prova do 404', async () => {
    const { classifySite } = await import('../lib/bot-protection.ts')
    for (const status of [0, 401, 403, 429, 500, 502, 418]) {
      const r = classifySite({ site: 'Instagram', httpStatus: status })
      assert.notEqual(r.verdict, 'not_found', `HTTP ${status} não pode virar not_found`)
    }
  })
})

describe('fonte autoritativa do Instagram (Central/Apify)', () => {
  it('perfil encontrado vira "ok" com os dados reais', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({
      success: true,
      data: {
        configured: true,
        profile: {
          username: 'sr__amorim',
          fullName: 'Daniel Amorim',
          biography: 'Reservado no jeito.',
          followersCount: 11478,
          followsCount: 465,
          postsCount: 136,
          isPrivate: false,
          verified: false,
        },
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('sr__amorim', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'ok')
      if (r.kind === 'ok') {
        assert.equal(r.profile.fullName, 'Daniel Amorim')
        assert.equal(r.profile.followers, 11478)
        assert.equal(r.profile.posts, 136)
        assert.equal(r.profile.platform, 'Instagram')
      }
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('perfil privado é desfecho próprio, não "ok" nem "not_found"', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: { configured: true, profile: { username: 'x', isPrivate: true } },
    }), { status: 200 })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('x', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'private')
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('"não encontrado" só quando a fonte afirma que não existe', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: { configured: true, errors: ['Perfil não encontrado ou privado.'] },
    }), { status: 200 })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('inexistente_zzz', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'not_found')
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('fonte sem chave é "not_configured", nunca "not_found"', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: { configured: false, errors: ['Chave Apify não configurada (APIFY_API_TOKEN).'] },
    }), { status: 200 })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('sr__amorim', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'not_configured')
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('limite diário da fonte vira rate_limited', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: { configured: true, errors: ['Limite diário de consultas Apify atingido (40/dia).'] },
    }), { status: 200 })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('sr__amorim', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'rate_limited')
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('401/403 da fonte é auth_error, não ausência', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    for (const status of [401, 403]) {
      globalThis.fetch = (async () => new Response('{}', { status })) as typeof fetch
      const r = await fetchInstagramFromCentral('x', { baseUrl: 'https://exemplo.test' })
      assert.equal(r.kind, 'auth_error', `HTTP ${status} deveria ser auth_error`)
    }
    globalThis.fetch = fetchReal
  })

  it('500 ou JSON inválido é unavailable, nunca not_found', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch

    globalThis.fetch = (async () => new Response('{}', { status: 500 })) as typeof fetch
    assert.equal((await fetchInstagramFromCentral('x', { baseUrl: 'https://e.test' })).kind, 'unavailable')

    globalThis.fetch = (async () => new Response('<html>erro</html>', { status: 200 })) as typeof fetch
    assert.equal((await fetchInstagramFromCentral('x', { baseUrl: 'https://e.test' })).kind, 'unavailable')

    globalThis.fetch = (async () => { throw new Error('rede caiu') }) as typeof fetch
    assert.equal((await fetchInstagramFromCentral('x', { baseUrl: 'https://e.test' })).kind, 'unavailable')

    globalThis.fetch = fetchReal
  })

  it('sucesso sem perfil e sem erro conhecido não vira not_found', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: {} }), { status: 200 })) as typeof fetch
    try {
      const r = await fetchInstagramFromCentral('x', { baseUrl: 'https://e.test' })
      assert.equal(r.kind, 'unavailable')
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('a URL chamada usa o username normalizado, sem @', async () => {
    const { fetchInstagramFromCentral } = await import('../lib/instagram/central-source.ts')
    const fetchReal = globalThis.fetch
    let corpo: any = null
    globalThis.fetch = (async (_u: any, init: any) => {
      corpo = JSON.parse(init.body)
      return new Response(JSON.stringify({ data: { configured: false } }), { status: 200 })
    }) as typeof fetch
    try {
      await fetchInstagramFromCentral('sr__amorim', { baseUrl: 'https://e.test' })
      assert.deepEqual(corpo, { username: 'sr__amorim' })
    } finally {
      globalThis.fetch = fetchReal
    }
  })

  it('nenhuma credencial aparece no código do cliente', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../lib/instagram/central-source.ts', import.meta.url), 'utf8')
    assert.ok(!/apify_api_/.test(src), 'token do Apify não pode estar no código')
    assert.ok(!/Bearer\s+[A-Za-z0-9]/.test(src), 'não pode haver Authorization hardcoded')
  })
})

describe('mensagens por desfecho', () => {
  it('cada desfecho tem mensagem própria e nenhuma diz "não encontrado" sem prova', async () => {
    const { outcomeToMessage } = await import('../lib/instagram/central-source.ts')
    const casos: [Parameters<typeof outcomeToMessage>[0], RegExp][] = [
      [{ kind: 'ok' }, /encontrado/i],
      [{ kind: 'private' }, /privado/i],
      [{ kind: 'not_found' }, /Nenhum perfil encontrado/i],
      [{ kind: 'not_configured' }, /não está configurada/i],
      [{ kind: 'rate_limited' }, /limite de hoje/i],
      [{ kind: 'auth_error' }, /recusou/i],
      [{ kind: 'unavailable', detail: 'timeout' }, /falhou/i],
    ]
    for (const [outcome, padrao] of casos) {
      assert.match(outcomeToMessage(outcome), padrao, `desfecho ${outcome.kind}`)
    }
  })
})
