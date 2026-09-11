import { writeFileSync } from 'fs';
import { join } from 'path';
import type { PostMeta, SiteConfig } from '../../types.js';
import { joinSiteUrl } from '../../domain/site-url.js';
import { collectPublicPaths } from '../../application/seo/collect-public-paths.js';
import { buildSitemapXml } from '../../application/seo/build-sitemap.js';
import { buildRobotsTxt } from '../../application/seo/build-robots.js';

export interface SeoGeneratorOptions {
  /** 사이트 루트 dist (로케일 하위가 아님) */
  outDir: string;
  config: SiteConfig;
  /** 로케일별 공개 포스트 (draft 제외된 메타) */
  postsByLocale: Map<string, PostMeta[]>;
  /** 로케일별 고정 페이지 슬러그 */
  pagesByLocale?: Map<string, string[]>;
}

/**
 * 루트 sitemap.xml · robots.txt 생성.
 * 모든 로케일 공개 URL을 하나의 sitemap에 합친다.
 */
export function generateSeoArtifacts(opts: SeoGeneratorOptions): void {
  const { outDir, config, postsByLocale, pagesByLocale } = opts;
  const siteUrl = config.site.url;
  const defaultLocale = config.i18n.defaultLocale;
  const tax = config.taxonomy;

  const taxonomyBase = {
    tags: tax.tags?.slug ?? '/tags',
    topics: tax.topics?.slug ?? '/topics',
    keywords: tax.keywords?.slug ?? '/keywords',
    category: tax.category?.slug ?? '/categories',
  };

  const allPaths: string[] = [];

  for (const locale of config.i18n.locales) {
    const localePrefix = locale.code === defaultLocale ? '' : `/${locale.code}`;
    const posts = postsByLocale.get(locale.code) ?? [];
    allPaths.push(
      ...collectPublicPaths({
        localePrefix,
        posts,
        staticPageSlugs: pagesByLocale?.get(locale.code) ?? [],
        taxonomyBase,
      }),
    );
  }

  const absoluteUrls = [...new Set(allPaths)].map((path) => {
    if (path === '/') return joinSiteUrl(siteUrl, '');
    return joinSiteUrl(siteUrl, path);
  });

  // root loc: prefer trailing slash form commonly expected — use siteUrl as-is normalized
  const urls = absoluteUrls.map((u) => (u === joinSiteUrl(siteUrl, '') ? `${joinSiteUrl(siteUrl, '')}/` : u));

  writeFileSync(join(outDir, 'sitemap.xml'), buildSitemapXml(urls), 'utf-8');
  writeFileSync(join(outDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf-8');

  console.log(
    `\x1b[32m✓ SEO: sitemap.xml (${urls.length} urls) + robots.txt\x1b[0m`,
  );
}
