import { describe, expect, it } from 'vitest';
import { joinSiteUrl, normalizePath } from '../../src/domain/site-url.js';

describe('joinSiteUrl', () => {
  it('joins base and path without double slash', () => {
    expect(joinSiteUrl('https://example.com/', '/posts/hello')).toBe(
      'https://example.com/posts/hello',
    );
  });

  it('adds leading slash to relative path', () => {
    expect(joinSiteUrl('https://example.com', 'posts/hello')).toBe(
      'https://example.com/posts/hello',
    );
  });

  it('returns base when path is empty or root', () => {
    expect(joinSiteUrl('https://example.com/', '')).toBe('https://example.com');
    expect(joinSiteUrl('https://example.com/', '/')).toBe('https://example.com');
  });
});

describe('normalizePath', () => {
  it('ensures leading slash and strips trailing slash', () => {
    expect(normalizePath('posts/a/')).toBe('/posts/a');
    expect(normalizePath('/posts/a/')).toBe('/posts/a');
    expect(normalizePath('')).toBe('/');
  });
});
