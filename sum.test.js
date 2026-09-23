import { describe, expect, it } from 'vitest';
import { sum } from './sum.js';

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('handles negative and zero values', () => {
    expect(sum(-4, 9)).toBe(5);
    expect(sum(0, 0)).toBe(0);
  });
});
