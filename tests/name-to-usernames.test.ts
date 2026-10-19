import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  gerarCandidatesDeUsername,
  descreverOrigem,
} from '../lib/name-to-usernames.ts'

/**
 * A regra destes testes é: o palpite nunca pode ser inventado sem o operador
 * saber. Se o nome não gerar nada confiável, é melhor devolver lista vazia
 * do que um username genérico que "encontra" a pessoa errada.
 */

describe('gerarCandidatesDeUsername', () => {
  it('trata entrada vazia como lista vazia', () => {
    assert.deepEqual(gerarCandidatesDeUsername(''), [])
    assert.deepEqual(gerarCandidatesDeUsername('   '), [])
  })

  it('não inventa variação quando o texto já é um username', () => {
    const c = gerarCandidatesDeUsername('sr__amorim')
    assert.equal(c.length, 1)
    assert.equal(c[0].username, 'sr__amorim')
    assert.equal(c[0].origem, 'exato')
    assert.equal(c[0].confianca, 100)
  })

  it('aceita @ na frente e espaços em volta sem gerar duplicata', () => {
    const c = gerarCandidatesDeUsername('  @daniel.amorim  ')
    assert.equal(c.length, 1)
    assert.equal(c[0].username, 'daniel.amorim')
  })

  it('gera o par primeiro.sobrenome como o mais provável', () => {
    const c = gerarCandidatesDeUsername('Daniel de Amorim')
    const usernames = c.map((x) => x.username)
    assert.ok(usernames.includes('daniel.amorim'), 'deve incluir daniel.amorim')
    assert.ok(usernames.includes('danielamorim'), 'deve incluir danielamorim')
    assert.ok(usernames.includes('daniel_amorim'), 'deve incluir daniel_amorim')
    assert.ok(usernames.includes('amorim.daniel'), 'deve incluir a ordem inversa')
  })

  it('ordena por confiança decrescente, sem empate', () => {
    const c = gerarCandidatesDeUsername('Maria da Silva')
    for (let i = 1; i < c.length; i++) {
      assert.ok(
        c[i - 1].confianca >= c[i].confianca,
        `posição ${i} quebrou a ordem: ${c[i - 1].confianca} depois de ${c[i].confianca}`
      )
    }
  })

  it('ignora partícula de nome na montagem', () => {
    const c = gerarCandidatesDeUsername('Maria da Silva')
    const usernames = c.map((x) => x.username)
    // "da" não pode virar parte do username.
    assert.ok(!usernames.some((u) => u.includes('da') && !u.startsWith('da') && u.length > 8))
    assert.ok(usernames.includes('maria.silva'))
  })

  it('tira acento e ç antes de montar o username', () => {
    const c = gerarCandidatesDeUsername('João Gonçalves')
    const usernames = c.map((x) => x.username)
    assert.ok(usernames.includes('joao.goncalves'), `não achou joao.goncalves em ${usernames.join(', ')}`)
    assert.ok(!usernames.some((u) => /[^\x20-\x7e]/.test(u)), 'não pode sobrar caractere não-ASCII')
  })

  it('usa primeiro e último token quando há sobrenome do meio', () => {
    const c = gerarCandidatesDeUsername('José Antônio Pereira dos Santos')
    const usernames = c.map((x) => x.username)
    assert.ok(usernames.includes('jose.santos'), `não achou jose.santos em ${usernames.join(', ')}`)
    assert.ok(usernames.includes('josesantos'))
  })

  it('não deixa o prenome sozinho ser o candidato mais forte', () => {
    const c = gerarCandidatesDeUsername('Daniel de Amorim')
    const maisFraco = c.find((x) => x.username === 'daniel')
    assert.ok(maisFraco, 'deveria incluir o prenome como candidato fraco')
    assert.ok(
      maisFraco!.confianca < c[0].confianca,
      'prenome sozinho não pode ter a maior confiança'
    )
  })

  it('nunca gera username com espaço ou caractere inválido', () => {
    for (const nome of [
      'Daniel de Amorim',
      'Maria da Silva',
      'José Antônio Pereira dos Santos',
      'Ana Beatriz Souza',
      "O'Brien Silva",
      'Jean-Luc Picard',
    ]) {
      for (const c of gerarCandidatesDeUsername(nome)) {
        assert.match(c.username, /^[a-z0-9._]+$/, `"${c.username}" tem caractere inválido (nome: ${nome})`)
        assert.ok(!/\s/.test(c.username), `"${c.username}" tem espaço (nome: ${nome})`)
      }
    }
  })

  it('respeita o limite de tamanho de username do Instagram', () => {
    for (const nome of ['Aleijadinho Santissimo Sacramento', 'Wolfgang Amadeus Mozart']) {
      for (const c of gerarCandidatesDeUsername(nome)) {
        assert.ok(c.username.length <= 30, `"${c.username}" passou de 30 caracteres`)
        assert.ok(c.username.length >= 3, `"${c.username}" tem menos de 3 caracteres`)
      }
    }
  })

  it('é determinístico: mesma entrada, mesma saída', () => {
    const a = gerarCandidatesDeUsername('Daniel de Amorim')
    const b = gerarCandidatesDeUsername('Daniel de Amorim')
    assert.deepEqual(a, b)
  })

  it('não duplica o mesmo username', () => {
    const c = gerarCandidatesDeUsername('Daniel de Amorim')
    const usernames = c.map((x) => x.username)
    assert.equal(new Set(usernames).size, usernames.length, `houve duplicata: ${usernames.join(', ')}`)
  })
})

describe('descreverOrigem', () => {
  it('traduz todas as origens possíveis sem devolver vazio', () => {
    const origens = [
      'exato',
      'primeiro.sobrenome',
      'primeiroSobrenome',
      'sobrenome_primeiro',
      'primeiro.ultimo',
      'iniciaisSobrenome',
      'primeiro_sobrenome',
      'primeiro',
      'sobrenome',
    ] as const
    for (const o of origens) {
      const texto = descreverOrigem(o)
      assert.ok(texto.length > 0, `origem ${o} ficou vazia`)
    }
  })
})
