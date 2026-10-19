import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber, truncate, cn, generateId } from '../lib/utils.ts'

describe('formatNumber', () => {
  it('deve formatar milhões', () => {
    assert.equal(formatNumber(1500000), '1.5M')
  })

  it('deve formatar milhares', () => {
    assert.equal(formatNumber(2500), '2.5K')
  })

  it('deve retornar número pequeno sem formatação', () => {
    assert.equal(formatNumber(99), '99')
  })

  it('deve formatar zero', () => {
    assert.equal(formatNumber(0), '0')
  })
})

describe('truncate', () => {
  it('deve truncar string longa', () => {
    assert.equal(truncate('abcdefghij', 5), 'abcde...')
  })

  it('deve retornar string curta sem alteração', () => {
    assert.equal(truncate('abc', 5), 'abc')
  })

  it('deve truncar string exata no limite', () => {
    assert.equal(truncate('abcde', 5), 'abcde')
  })
})

describe('cn', () => {
  it('deve combinar classes', () => {
    const result = cn('foo', 'bar')
    assert.ok(result.includes('foo'))
    assert.ok(result.includes('bar'))
  })

  it('deve lidar com undefined', () => {
    const result = cn('foo', undefined, 'bar')
    assert.ok(result.includes('foo'))
    assert.ok(result.includes('bar'))
  })
})

describe('generateId', () => {
  it('deve gerar string não vazia', () => {
    const id = generateId()
    assert.ok(id.length > 0)
  })

  it('deve gerar IDs únicos', () => {
    const id1 = generateId()
    const id2 = generateId()
    assert.notEqual(id1, id2)
  })
})
