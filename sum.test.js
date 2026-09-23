import test from 'node:test';
import assert from 'node:assert/strict';
import { sum } from './sum.js';

test('adds two numbers', () => {
  assert.equal(sum(2, 3), 5);
});

test('handles negative and zero values', () => {
  assert.equal(sum(-4, 9), 5);
  assert.equal(sum(0, 0), 0);
});
