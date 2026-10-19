import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePhone } from '../lib/whatsapp-osint.ts';

test('sanitiza número internacional formatado', () => {
  assert.equal(sanitizePhone('+55 (47) 99787-6098'), '5547997876098');
});

test('mantém número nacional sem país (não adivinha país)', () => {
  assert.equal(sanitizePhone('11 91234-5678'), '11912345678');
});

test('preserva número com código do Brasil', () => {
  assert.equal(sanitizePhone('554797876098'), '554797876098');
});

test('código de outro país é preservado', () => {
  assert.equal(sanitizePhone('34612345678'), '34612345678');
});

test('entrada vazia não quebra', () => {
  assert.equal(sanitizePhone(''), '');
});