import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parsePhoneNumber, validatePhoneNumber, phoneInfoToSearchResult } from '../lib/phone.ts'

describe('parsePhoneNumber', () => {
  it('deve parsear número brasileiro com código do país', () => {
    const result = parsePhoneNumber('+5511999998888')
    assert.notEqual(result, null)
    assert.equal(result!.country_code, '+55')
    assert.equal(result!.valid, true)
    assert.equal(result!.possible, true)
  })

  it('deve retornar null para string vazia', () => {
    const result = parsePhoneNumber('')
    assert.equal(result, null)
  })

  it('deve parsear número americano', () => {
    const result = parsePhoneNumber('+12025551234', 'US')
    assert.notEqual(result, null)
    assert.equal(result!.valid, true)
  })

  it('deve identificar tipo de linha', () => {
    const result = parsePhoneNumber('+5511999998888')
    assert.notEqual(result, null)
    assert.ok(result!.line_type.length > 0)
  })
})

describe('validatePhoneNumber', () => {
  it('deve retornar true para número válido BR', () => {
    assert.equal(validatePhoneNumber('+5511999998888'), true)
  })

  it('deve retornar false para string inválida', () => {
    assert.equal(validatePhoneNumber('abc'), false)
  })

  it('deve retornar false para string vazia', () => {
    assert.equal(validatePhoneNumber(''), false)
  })
})

describe('phoneInfoToSearchResult', () => {
  it('deve converter PhoneInfo para SearchResult', () => {
    const info = parsePhoneNumber('+5511999998888')
    assert.notEqual(info, null)
    const result = phoneInfoToSearchResult(info!)
    assert.equal(result.source, 'phonenumbers')
    assert.equal(result.platform, 'Telefone')
    assert.ok(result.id.startsWith('phone-'))
    assert.ok(result.timestamp > 0)
  })
})
