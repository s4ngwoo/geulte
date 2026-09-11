import { describe, expect, it } from 'vitest';
import {
  matchesCriteria,
  filterPosts,
  executeFilter,
  calculateFacets,
} from '../../src/core/filter-engine.js';
import type { PostMeta } from '../../src/types.js';

function meta(partial: Partial<PostMeta> & Pick<PostMeta, 'slug' | 'title'>): PostMeta {
  return {
    date: new Date('2026-01-01'),
    tags: [],
    topics: [],
    keywords: [],
    draft: false,
    filePath: `/tmp/${partial.slug}.md`,
    ...partial,
  };
}

const posts: PostMeta[] = [
  meta({
    slug: 'a',
    title: 'A',
    tags: ['ai', 'llm'],
    topics: ['rag'],
    category: 'tech',
    series: 's1',
  }),
  meta({
    slug: 'b',
    title: 'B',
    tags: ['ai'],
    topics: ['ops'],
    category: 'tech',
  }),
  meta({
    slug: 'c',
    title: 'C',
    tags: ['life'],
    category: 'essay',
  }),
];

describe('matchesCriteria', () => {
  it('requires all listed tags (AND)', () => {
    expect(matchesCriteria(posts[0], { tags: ['ai', 'llm'] })).toBe(true);
    expect(matchesCriteria(posts[1], { tags: ['ai', 'llm'] })).toBe(false);
  });

  it('filters by category and series', () => {
    expect(matchesCriteria(posts[0], { category: 'tech', series: 's1' })).toBe(true);
    expect(matchesCriteria(posts[1], { series: 's1' })).toBe(false);
  });
});

describe('filterPosts / executeFilter', () => {
  it('filters by tag', () => {
    const result = filterPosts(posts, { tags: ['ai'] });
    expect(result.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('paginates and reports hasMore', () => {
    const page1 = executeFilter(posts, {}, 1, 2);
    expect(page1.posts).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page1.hasMore).toBe(true);

    const page2 = executeFilter(posts, {}, 2, 2);
    expect(page2.posts).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
  });
});

describe('calculateFacets', () => {
  it('counts tags and categories on filtered set', () => {
    const facets = calculateFacets(filterPosts(posts, { tags: ['ai'] }));
    expect(facets.tags.ai).toBe(2);
    expect(facets.categories.tech).toBe(2);
    expect(facets.categories.essay).toBeUndefined();
  });
});
