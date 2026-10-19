import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifySite, privateMessage, BOT_PROTECTED_SITES } from '../lib/bot-protection.ts'

/**
 * Esta é a função mais importante do projeto para a confiança do operador.
 *
 * A regra que ela protege: um bloqueio de plataforma NUNCA pode virar
 * "não encontrado". Quem investigates precisa poder distinguir três coisas
 * bem diferentes:
 *
 *   - o perfil não existe        -> 404, ou o corpo dizendo que não existe
 *   - a plataforma bloqueou      -> 401/403/429, ou 200 sem dados do perfil
 *   - a plataforma está fora do ar -> 5xx, timeout, erro de rede
 *
 * Confundir as três faz o investigator concluir "essa pessoa não existe em
 * lugar nenhum" quando o truth é "não deu para consultar".
 */

describe('classifySite — bloqueio nunca vira "não encontrado"', () => {
  for (const status of [401, 403, 429]) {
    it(`HTTP ${status} é "possible", não "not_found"`, () => {
      const r = classifySite({ site: 'Instagram', httpStatus: status })
      assert.equal(r.verdict, 'possible')
      assert.equal(r.exists, false, 'bloqueio não confirma existência')
      assert.equal(r.uiStatus, 'possible')
      assert.notEqual(r.uiStatus, 'not_found')
    })
  }

  it('403 tem mensagem que diz que a plataforma bloqueia', () => {
    const r = classifySite({ site: 'Instagram', httpStatus: 403 })
    assert.match(r.message, /bloqueia consultas automáticas/i)
  })

  it('429 tem mensagem que fala em limite de consultas', () => {
    const r = classifySite({ site: 'TikTok', httpStatus: 429 })
    assert.match(r.message, /limitou o número de consultas/i)
  })

  it('401 tem mensagem própria', () => {
    const r = classifySite({ site: 'LinkedIn', httpStatus: 401 })
    assert.match(r.message, /recusou a consulta/i)
  })

  it('a mensagem de bloqueio manda confirmar no link', () => {
    const r = classifySite({ site: 'Instagram', httpStatus: 403 })
    assert.match(r.message, /abra o link/i)
  })
})

describe('classifySite — só 404 prova ausência', () => {
  it('HTTP 404 é "not_found"', () => {
    const r = classifySite({ site: 'GitHub', httpStatus: 404 })
    assert.equal(r.verdict, 'not_found')
    assert.equal(r.exists, false)
    assert.equal(r.uiStatus, 'not_found')
    assert.equal(r.score, 0)
  })

  it('corpo dizendo que não existe também é "not_found", mesmo com 200', () => {
    const r = classifySite({
      site: 'Telegram',
      httpStatus: 200,
      bodySaysNotFound: true,
    })
    assert.equal(r.verdict, 'not_found')
    assert.equal(r.exists, false)
  })

  it('nenhum outro status vira "not_found"', () => {
    for (const status of [0, 301, 302, 400, 401, 403, 418, 429, 500, 502, 503]) {
      const r = classifySite({ site: 'Qualquer', httpStatus: status })
      assert.notEqual(
        r.uiStatus,
        'not_found',
        `HTTP ${status} não deveria virar "não encontrado"`
      )
    }
  })
})

describe('classifySite — erro de servidor é indisponível, não ausência', () => {
  for (const status of [500, 502, 503, 504]) {
    it(`HTTP ${status} é "unavailable"`, () => {
      const r = classifySite({ site: 'Medium', httpStatus: status })
      assert.equal(r.verdict, 'unavailable')
      assert.equal(r.uiStatus, 'unavailable')
      assert.equal(r.exists, false)
    })
  }

  it('status 0 (timeout/rede) é "unavailable"', () => {
    const r = classifySite({ site: 'Medium', httpStatus: 0 })
    assert.equal(r.verdict, 'unavailable')
    assert.match(r.message, /tempo limite ou rede/i)
  })

  it('5xx diz que a plataforma está fora do ar, com o código', () => {
    const r = classifySite({ site: 'Medium', httpStatus: 503 })
    assert.match(r.message, /fora do ar/i)
    assert.match(r.message, /503/)
  })
})

describe('classifySite — 200 sem dados de perfil', () => {
  it('200 com contentLooksLikeProfile false é "possible"', () => {
    const r = classifySite({
      site: 'Instagram',
      httpStatus: 200,
      contentLooksLikeProfile: false,
    })
    assert.equal(r.verdict, 'possible')
    assert.equal(r.exists, false)
    assert.match(r.message, /provável bloqueio/i)
  })

  it('200 com contentLooksLikeProfile true é "found"', () => {
    const r = classifySite({
      site: 'Instagram',
      httpStatus: 200,
      contentLooksLikeProfile: true,
    })
    assert.equal(r.verdict, 'found')
    assert.equal(r.exists, true)
  })

  it('200 sem informação de corpo é tratado como perfil (compatibilidade)', () => {
    const r = classifySite({ site: 'GitHub', httpStatus: 200 })
    assert.equal(r.verdict, 'found')
  })
})

describe('classifySite — pontuação', () => {
  it('found vale mais que private, que vale mais que possible', () => {
    const found = classifySite({ site: 'X', httpStatus: 200 }).score
    const possible = classifySite({ site: 'X', httpStatus: 403 }).score
    const unavailable = classifySite({ site: 'X', httpStatus: 0 }).score
    const notFound = classifySite({ site: 'X', httpStatus: 404 }).score
    assert.ok(found > possible, `${found} deveria ser maior que ${possible}`)
    assert.ok(possible > unavailable, `${possible} deveria ser maior que ${unavailable}`)
    assert.ok(unavailable > notFound, `${unavailable} deveria ser maior que ${notFound}`)
  })

  it('só not_found vale zero', () => {
    assert.equal(classifySite({ site: 'X', httpStatus: 404 }).score, 0)
  })

  it('todos os veredictos têm score inteiro entre 0 e 100', () => {
    for (const status of [0, 200, 301, 403, 404, 429, 500, 999]) {
      const { score } = classifySite({ site: 'X', httpStatus: status })
      assert.ok(Number.isInteger(score), `score ${score} não é inteiro`)
      assert.ok(score >= 0 && score <= 100, `score ${score} fora de 0..100`)
    }
  })
})

describe('classifySite — message nunca é vazia', () => {
  it('todo status produz texto para o usuário', () => {
    for (const status of [0, 200, 204, 301, 400, 401, 403, 404, 418, 429, 500, 999]) {
      const r = classifySite({ site: 'Teste', httpStatus: status })
      assert.ok(r.message.length > 0, `HTTP ${status} ficou sem mensagem`)
    }
  })

  it('toda mensagem menciona a plataforma', () => {
    const r = classifySite({ site: 'Instagram', httpStatus: 403 })
    assert.match(r.message, /Instagram/)
  })
})

describe('BOT_PROTECTED_SITES', () => {
  it('inclui as redes que bloqueiam datacenter', () => {
    for (const site of ['Instagram', 'TikTok', 'Facebook', 'X (Twitter)', 'Threads', 'LinkedIn', 'Pinterest']) {
      assert.ok(BOT_PROTECTED_SITES.has(site), `falta ${site}`)
    }
  })
})

describe('privateMessage', () => {
  it('avisa que o perfil é privado, sem dizer que não existe', () => {
    const m = privateMessage('Instagram')
    assert.match(m, /privado/i)
    assert.doesNotMatch(m, /não existe/i)
  })
})
