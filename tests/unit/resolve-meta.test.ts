import { describe, expect, it } from 'vitest';
import {
  resolveSeoDescription,
  resolveCoverImage,
} from '../../src/application/seo/resolve-meta.js';

describe('resolveSeoDescription', () => {
  it('prefers frontmatter description over excerpt', () => {
    expect(
      resolveSeoDescription({
        description: 'Custom',
        excerpt: 'Auto excerpt',
        siteDescription: 'Site',
      }),
    ).toBe('Custom');
  });

  it('falls back to excerpt then site', () => {
    expect(resolveSeoDescription({ excerpt: 'Ex', siteDescription: 'Site' })).toBe('Ex');
    expect(resolveSeoDescription({ siteDescription: 'Site' })).toBe('Site');
    expect(resolveSeoDescription({})).toBe('');
  });
});

describe('resolveCoverImage', () => {
  it('prefers cover over image over generated', () => {
    expect(
      resolveCoverImage({
        cover: '/a.png',
        image: '/b.png',
        generatedOgUrl: 'https://x/og/y.png',
      }),
    ).toBe('/a.png');
    expect(resolveCoverImage({ image: '/b.png', generatedOgUrl: 'https://x/og/y.png' })).toBe(
      '/b.png',
    );
    expect(resolveCoverImage({ generatedOgUrl: 'https://x/og/y.png' })).toBe(
      'https://x/og/y.png',
    );
  });
});
