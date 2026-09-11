import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBuild } from '../../src/cli/build.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, '../fixtures/minimal-vault');

describe('minimal vault build smoke', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'geulte-p0-'));
    cpSync(FIXTURE, projectRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('builds index.html and rss.xml; excludes drafts', async () => {
    await runBuild({ projectRoot, syncDb: false });

    const dist = join(projectRoot, 'dist');
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'rss.xml'))).toBe(true);
    expect(existsSync(join(dist, 'posts/hello/index.html'))).toBe(true);

    // draft excluded at scan — no page for draft-note
    expect(existsSync(join(dist, 'posts/draft-note/index.html'))).toBe(false);

    const home = readFileSync(join(dist, 'index.html'), 'utf-8');
    expect(home).toContain('Hello Fixture');

    const rss = readFileSync(join(dist, 'rss.xml'), 'utf-8');
    expect(rss).toContain('Hello Fixture');
    expect(rss).not.toContain('<title>Draft Note</title>');

    const postsJson = JSON.parse(
      readFileSync(join(dist, '_geulte/data/posts.json'), 'utf-8'),
    ) as Array<{ slug: string; title: string }>;
    expect(postsJson.map((p) => p.slug)).toEqual(['hello']);
    expect(postsJson.some((p) => p.title === 'Draft Note')).toBe(false);
    expect(postsJson.some((p) => p.slug === 'about')).toBe(false);

    // P5 static page
    expect(existsSync(join(dist, 'about/index.html'))).toBe(true);
    const aboutHtml = readFileSync(join(dist, 'about/index.html'), 'utf-8');
    expect(aboutHtml).toContain('About this fixture site');
    expect(aboutHtml).toContain('/assets/about-cover.png');

    // P1 SEO
    expect(existsSync(join(dist, 'sitemap.xml'))).toBe(true);
    expect(existsSync(join(dist, 'robots.txt'))).toBe(true);
    const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf-8');
    expect(sitemap).toContain('https://fixture.example/posts/hello');
    expect(sitemap).toContain('https://fixture.example/about');
    expect(sitemap).not.toContain('/dashboard');
    expect(sitemap).not.toContain('draft-note');
    const robots = readFileSync(join(dist, 'robots.txt'), 'utf-8');
    expect(robots).toContain('Sitemap: https://fixture.example/sitemap.xml');

    const postHtml = readFileSync(join(dist, 'posts/hello/index.html'), 'utf-8');
    expect(postHtml).toContain('rel="canonical"');
    expect(postHtml).toContain('href="https://fixture.example/posts/hello"');
    expect(postHtml).toContain('application/ld+json');

    // P4: production dist must not embed live-reload client
    expect(postHtml).not.toContain('/_geulte/livereload');
    expect(home).not.toContain('EventSource');
  });
});
