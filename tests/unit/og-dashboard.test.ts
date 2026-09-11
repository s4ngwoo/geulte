import { describe, expect, it } from 'vitest';
import { wrapText } from '../../src/domain/wrap-text.js';
import {
  countDashboardStats,
  shouldGenerateDashboard,
} from '../../src/application/dashboard/stats.js';
import { resolveOgFontPath } from '../../src/core/generators/og-generator.js';
import type { PostMeta } from '../../src/types.js';

function meta(partial: Partial<PostMeta> & Pick<PostMeta, 'slug' | 'title'>): PostMeta {
  return {
    date: new Date('2026-09-11'),
    tags: [],
    topics: [],
    keywords: [],
    draft: false,
    filePath: '/tmp/x.md',
    ...partial,
  };
}

describe('wrapText (domain)', () => {
  it('wraps by char count and caps at 2 lines', () => {
    expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh']);
    expect(wrapText('단', 10)).toEqual(['단']);
  });
});

describe('dashboard stats', () => {
  it('excludes drafts from totalPosts', () => {
    const stats = countDashboardStats([
      meta({ slug: 'a', title: 'A', tags: ['x'], category: 'c' }),
      meta({ slug: 'b', title: 'B', draft: true, tags: ['y'] }),
    ]);
    expect(stats.totalPosts).toBe(1);
    expect(stats.tagCount).toBe(2);
    expect(stats.categoryCount).toBe(1);
  });

  it('shouldGenerateDashboard is false without database url', () => {
    expect(shouldGenerateDashboard({})).toBe(false);
    expect(shouldGenerateDashboard({ database: { url: 'https://x.supabase.co' } })).toBe(true);
  });
});

describe('resolveOgFontPath', () => {
  it('returns null when neither user nor builtin font exists', () => {
    expect(resolveOgFontPath('/tmp/geulte-no-dist-xyz', '/tmp/no-such-font.ttf')).toBeNull();
  });
});
