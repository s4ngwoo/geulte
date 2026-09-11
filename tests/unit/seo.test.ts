import { describe, expect, it } from 'vitest';
import { buildCanonical } from '../../src/application/seo/build-canonical.js';
import { buildSitemapXml } from '../../src/application/seo/build-sitemap.js';
import { buildRobotsTxt } from '../../src/application/seo/build-robots.js';
import { collectPublicPaths } from '../../src/application/seo/collect-public-paths.js';

describe('buildCanonical', () => {
  it('joins site url and path without trailing slash (except root)', () => {
    expect(buildCanonical('https://example.com/', '/')).toBe('https://example.com');
    expect(buildCanonical('https://example.com', '/posts/hello')).toBe(
      'https://example.com/posts/hello',
    );
  });
});

describe('buildSitemapXml', () => {
  it('emits absolute urls and omits empty set structure', () => {
    const xml = buildSitemapXml([
      'https://example.com/',
      'https://example.com/posts/hello',
    ]);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/posts/hello</loc>');
  });

  it('escapes & in urls', () => {
    const xml = buildSitemapXml(['https://example.com/a&b']);
    expect(xml).toContain('https://example.com/a&amp;b');
  });
});

describe('buildRobotsTxt', () => {
  it('allows all and points to sitemap', () => {
    const txt = buildRobotsTxt('https://example.com');
    expect(txt).toContain('User-agent: *');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
  });
});

describe('collectPublicPaths', () => {
  it('includes home, posts list, post pages, taxonomy, series; excludes drafts and dashboard', () => {
    const paths = collectPublicPaths({
      localePrefix: '',
      posts: [
        { slug: 'hello', draft: false, tags: ['test'], category: 'tech', series: 's1' },
        { slug: 'secret', draft: true, tags: ['x'] },
      ],
      taxonomyBase: {
        tags: '/tags',
        topics: '/topics',
        keywords: '/keywords',
        category: '/categories',
      },
    });

    expect(paths).toContain('/');
    expect(paths).toContain('/posts');
    expect(paths).toContain('/posts/hello');
    expect(paths).not.toContain('/posts/secret');
    expect(paths).not.toContain('/dashboard');
    expect(paths).toContain('/tags');
    expect(paths).toContain('/tags/test');
    expect(paths).toContain('/categories');
    expect(paths).toContain('/categories/tech');
    expect(paths).toContain('/series');
    expect(paths).toContain('/series/s1');
  });

  it('prefixes non-default locale paths', () => {
    const paths = collectPublicPaths({
      localePrefix: '/en',
      posts: [{ slug: 'hello', draft: false, tags: [] }],
      taxonomyBase: { tags: '/tags', category: '/categories' },
    });
    expect(paths).toContain('/en');
    expect(paths).toContain('/en/posts');
    expect(paths).toContain('/en/posts/hello');
  });

  it('includes static page slugs outside /posts', () => {
    const paths = collectPublicPaths({
      localePrefix: '',
      posts: [{ slug: 'hello', draft: false, tags: [] }],
      staticPageSlugs: ['about'],
      taxonomyBase: { tags: '/tags', category: '/categories' },
    });
    expect(paths).toContain('/about');
    expect(paths).not.toContain('/posts/about');
  });
});
