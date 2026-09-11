import { describe, expect, it } from 'vitest';
import {
  planImageOptimization,
  rewriteImgTagForPlan,
  extractImgSrcs,
} from '../../src/application/images/plan-optimize.js';

describe('planImageOptimization', () => {
  it('skips remote, svg, data urls', () => {
    expect(planImageOptimization('https://x.com/a.png', [640]).skip).toBe(true);
    expect(planImageOptimization('/a.svg', [640]).reason).toBe('svg');
    expect(planImageOptimization('data:image/png;base64,xx', [640]).reason).toBe('data');
  });

  it('plans webp variants for local paths', () => {
    const plan = planImageOptimization('/assets/photo.png', [1280, 640]);
    expect(plan.skip).toBe(false);
    expect(plan.variants.map((v) => v.width)).toEqual([640, 1280]);
    expect(plan.variants[0].outRel).toContain('assets/opt/');
    expect(plan.variants[0].outRel).toMatch(/\.webp$/);
  });
});

describe('rewriteImgTagForPlan', () => {
  it('adds srcset and updates src', () => {
    const plan = planImageOptimization('/assets/photo.png', [640, 1280]);
    const html = '<p><img src="/assets/photo.png" alt="x"></p>';
    const out = rewriteImgTagForPlan(html, plan);
    expect(out).toContain('srcset=');
    expect(out).toContain('640w');
    expect(out).toContain('assets/opt/');
    expect(out).not.toMatch(/src="\/assets\/photo\.png"/);
  });
});

describe('extractImgSrcs', () => {
  it('collects unique srcs', () => {
    const html = '<img src="/a.png"><img src="/a.png"><img src="/b.jpg">';
    expect(extractImgSrcs(html).sort()).toEqual(['/a.png', '/b.jpg']);
  });
});

describe('optimizeContentImages adapter', () => {
  it('rewrites local img to webp srcset when enabled', async () => {
    const { mkdtempSync, mkdirSync, copyFileSync, rmSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    const { fileURLToPath } = await import('url');
    const { optimizeContentImages } = await import('../../src/core/images/optimize.js');
    const { SiteConfigSchema } = await import('../../src/schema.js');

    const root = mkdtempSync(join(tmpdir(), 'geulte-img-'));
    const assets = join(root, 'content', 'posts', 'assets');
    mkdirSync(assets, { recursive: true });
    const fixturePng = join(
      fileURLToPath(new URL('../fixtures/minimal-vault/content/posts/assets/sample.png', import.meta.url)),
    );
    copyFileSync(fixturePng, join(assets, 'sample.png'));

    const outDir = join(root, 'dist');
    mkdirSync(outDir, { recursive: true });

    const config = SiteConfigSchema.parse({
      site: { title: 'T', url: 'https://t.example' },
      build: { output: 'dist', images: { enabled: true, widths: [640, 1280], format: 'webp' } },
      i18n: { defaultLocale: 'ko', locales: [{ code: 'ko', label: '한국어' }] },
    });

    const post = {
      slug: 'img',
      title: 'Img',
      date: new Date('2026-09-11'),
      contentHtml: '<p><img src="/assets/sample.png" alt="s"></p>',
      contentRaw: '',
      excerpt: '',
      tags: [],
      topics: [],
      keywords: [],
      draft: false,
      filePath: '',
      wikilinks: [],
      headings: [],
    };

    const posts = new Map([['img', post as never]]);
    const n = await optimizeContentImages({
      projectRoot: root,
      outDir,
      config,
      posts,
    });

    expect(n).toBeGreaterThan(0);
    expect(post.contentHtml).toContain('srcset=');
    expect(post.contentHtml).toContain('.webp');
    expect(existsSync(join(outDir, 'assets/opt/assets/sample-640.webp'))).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });
});
