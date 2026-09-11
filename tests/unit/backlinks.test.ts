import { describe, expect, it } from 'vitest';
import {
  buildBacklinkMap,
  findRelatedPosts,
  toPostMeta,
} from '../../src/core/backlinks.js';
import type { Post } from '../../src/types.js';

function post(
  slug: string,
  overrides: Partial<Post> & { outLinks?: string[] } = {},
): Post {
  return {
    slug,
    title: overrides.title ?? slug,
    date: new Date('2026-01-01'),
    tags: overrides.tags ?? [],
    topics: overrides.topics ?? [],
    keywords: overrides.keywords ?? [],
    category: overrides.category,
    series: overrides.series,
    draft: false,
    filePath: `/tmp/${slug}.md`,
    contentHtml: '<p>x</p>',
    outLinks: overrides.outLinks ?? [],
    toc: [],
    ...overrides,
  };
}

describe('buildBacklinkMap', () => {
  it('maps target → sources and ignores self-links / duplicates', () => {
    const posts = new Map<string, Post>([
      ['a', post('a', { outLinks: ['b', 'b', 'a'] })],
      ['b', post('b', { outLinks: [] })],
      ['c', post('c', { outLinks: ['b'] })],
    ]);

    const map = buildBacklinkMap(posts);
    const sources = map.get('b')!.map((p) => p.slug).sort();
    expect(sources).toEqual(['a', 'c']);
    expect(map.has('a')).toBe(false);
  });
});

describe('findRelatedPosts', () => {
  it('scores series higher than category and returns top N', () => {
    const target = post('t', {
      tags: ['ai'],
      category: 'tech',
      series: 's1',
    });
    const posts = new Map<string, Post>([
      ['t', target],
      ['same-series', post('same-series', { series: 's1' })],
      ['same-cat', post('same-cat', { category: 'tech' })],
      ['same-tag', post('same-tag', { tags: ['ai'] })],
      ['unrelated', post('unrelated')],
    ]);

    const related = findRelatedPosts(target, posts, 3);
    expect(related.map((p) => p.slug)).toEqual([
      'same-series',
      'same-cat',
      'same-tag',
    ]);
  });
});

describe('toPostMeta', () => {
  it('drops heavy fields', () => {
    const meta = toPostMeta(post('x', { contentHtml: '<b>heavy</b>', outLinks: ['y'] }));
    expect(meta.slug).toBe('x');
    expect(meta).not.toHaveProperty('contentHtml');
    expect(meta).not.toHaveProperty('outLinks');
  });
});
