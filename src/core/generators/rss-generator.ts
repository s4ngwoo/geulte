import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { PostMeta, Post, SiteConfig } from '../../types.js';

export interface RssGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
  posts: Map<string, Post>;
}

/** XML 특수문자 이스케이프 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC-822 날짜 포맷 */
function toRfc822(date: Date): string {
  return date.toUTCString();
}

/** RSS <item> 블록 생성 */
function buildItem(
  post: PostMeta,
  fullPost: Post | undefined,
  siteUrl: string,
  fullContent: boolean,
): string {
  const url = `${siteUrl}/posts/${post.slug}/`;
  const title = escapeXml(post.title);
  const description = fullContent && fullPost
    ? `<![CDATA[${fullPost.contentHtml}]]>`
    : escapeXml(post.excerpt ?? '');
  const pubDate = toRfc822(post.date);
  const category = post.category ? `\n    <category>${escapeXml(post.category)}</category>` : '';
  const tags = post.tags.map((t) => `\n    <category>${escapeXml(t)}</category>`).join('');

  return `  <item>
    <title>${title}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>${category}${tags}
  </item>`;
}

/** RSS 문서 전체 생성 */
function buildFeed(
  title: string,
  description: string,
  feedUrl: string,
  siteUrl: string,
  items: string[],
  lastBuild: Date,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>ko</language>
    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;
}

/**
 * /rss.xml (전체) 및 /categories/{cat}/rss.xml 생성
 */
export function generateRssFeeds(opts: RssGeneratorOptions): void {
  const { outDir, config, postMetas, posts } = opts;
  const siteUrl = config.site.url.replace(/\/$/, '');
  const siteTitle = config.site.title;
  const siteDesc = config.site.description ?? siteTitle;
  const count = config.rss?.count ?? 20;
  const fullContent = config.rss?.fullContent ?? false;
  const now = new Date();

  const published = postMetas
    .filter((p) => !p.draft)
    .slice(0, count);

  // ── 1. 전체 RSS (/rss.xml) ─────────────────────────────────────────────────
  const allItems = published.map((p) =>
    buildItem(p, posts.get(p.slug), siteUrl, fullContent),
  );
  const allFeedUrl = `${siteUrl}/rss.xml`;
  const allFeed = buildFeed(siteTitle, siteDesc, allFeedUrl, siteUrl, allItems, now);
  writeFileSync(join(outDir, 'rss.xml'), allFeed, 'utf-8');

  // ── 2. 카테고리별 RSS (/categories/{cat}/rss.xml) ──────────────────────────
  const categorySlugBase = config.taxonomy.category?.slug ?? '/categories';

  const categories = [
    ...new Set(postMetas.filter((p) => p.category).map((p) => p.category!)),
  ];

  for (const cat of categories) {
    const catPosts = postMetas
      .filter((p) => !p.draft && p.category === cat)
      .slice(0, count);

    const catSlug = cat.toLowerCase().replace(/\s+/g, '-');
    const catPath = `${categorySlugBase}/${catSlug}`;
    const feedUrl = `${siteUrl}${catPath}/rss.xml`;
    const catTitle = `${siteTitle} — ${cat}`;
    const catDesc = `${cat} 카테고리의 최신 글 — ${siteDesc}`;

    const catItems = catPosts.map((p) =>
      buildItem(p, posts.get(p.slug), siteUrl, fullContent),
    );
    const catFeed = buildFeed(catTitle, catDesc, feedUrl, siteUrl, catItems, now);

    const catDir = join(outDir, catPath.replace(/^\//, ''));
    mkdirSync(catDir, { recursive: true });
    writeFileSync(join(catDir, 'rss.xml'), catFeed, 'utf-8');
  }

  console.log(
    `\x1b[32m✓ RSS 생성: /rss.xml + ${categories.length}개 카테고리 피드\x1b[0m`,
  );
}
