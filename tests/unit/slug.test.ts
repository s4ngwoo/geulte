import { describe, expect, it } from 'vitest';
import { toSlug, deduplicateSlug } from '../../src/core/utils/slug.js';

describe('toSlug', () => {
  it('keeps hangul and lowercases ascii', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
    expect(toSlug('한글 제목')).toBe('한글-제목');
  });

  it('strips special characters and collapses hyphens', () => {
    expect(toSlug('a---b!!c')).toBe('a-bc');
  });

  it('replaces dots with hyphens', () => {
    expect(toSlug('file.name')).toBe('file-name');
  });
});

describe('deduplicateSlug', () => {
  it('returns original when unique', () => {
    expect(deduplicateSlug('hello', new Set())).toBe('hello');
  });

  it('appends hash suffix when collision', () => {
    const result = deduplicateSlug('hello', new Set(['hello']));
    expect(result).toMatch(/^hello-[a-f0-9]{6}$/);
    expect(result).not.toBe('hello');
  });
});
