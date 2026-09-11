import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Post, PostMeta, SiteConfig, BacklinkMap } from '../types.js';
import { Renderer } from './renderer.js';
import { toPostMeta } from './backlinks.js';
import { buildSidebarData } from './taxonomy.js';
import { buildSearchIndex } from './search-index.js';
import { copyDir } from './generators/page-writer.js';
import { generateListPages } from './generators/list-generator.js';
import { generatePostPages } from './generators/post-generator.js';
import { generateTaxonomyPages } from './generators/taxonomy-generator.js';
import { generateSeriesPages } from './generators/series-generator.js';
import { generateRssFeeds } from './generators/rss-generator.js';
import { existsSync, readFileSync } from 'fs';
import { generateOgImages } from './generators/og-generator.js';
import { generateDashboard } from './generators/dashboard-generator.js';
import { generateSeoArtifacts } from './generators/seo-generator.js';
import { generateStaticPages } from './generators/page-generator.js';
import { optimizeContentImages } from './images/optimize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILT_IN_PUBLIC_DIR = join(__dirname, '../../public');

export interface BuildOptions {
  projectRoot: string;
  config: SiteConfig;
  posts: Map<string, Post>;
  pages?: Map<string, Post>;
  backlinkMap: BacklinkMap;
}

/**
 * 정적 사이트 빌더 메인 오케스트레이터
 */
export async function build(opts: BuildOptions): Promise<void> {
  const { projectRoot, config, posts, backlinkMap } = opts;
  const pages = opts.pages ?? new Map<string, Post>();
  const outDir = join(projectRoot, config.build.output);
  const renderer = new Renderer(projectRoot);
  const defaultLocale = config.i18n.defaultLocale;
  const locales = config.i18n.locales;

  // 정적 에셋 복사 (공통)
  mkdirSync(outDir, { recursive: true });
  copyDir(BUILT_IN_PUBLIC_DIR, join(outDir, '_geulte'));
  copyDir(join(BUILT_IN_PUBLIC_DIR, 'scripts'), join(outDir, 'scripts'));
  const userAssetsDir = join(projectRoot, 'content', 'posts', 'assets');
  if (existsSync(userAssetsDir)) copyDir(userAssetsDir, join(outDir, 'assets'));
  const userPublicDir = join(projectRoot, 'public');
  if (existsSync(userPublicDir)) copyDir(userPublicDir, outDir);

  // 이미지 최적화는 HTML 생성 전에 contentHtml을 재작성
  await optimizeContentImages({
    projectRoot,
    outDir,
    config,
    posts,
    pages,
  });

  const postsByLocale = new Map<string, PostMeta[]>();
  const pagesByLocale = new Map<string, string[]>();

  // 로케일별로 빌드
  for (const localeObj of locales) {
    const locale = localeObj.code;
    const isDefault = locale === defaultLocale;
    const localeOutDir = isDefault ? outDir : join(outDir, locale);
    const localePrefix = isDefault ? '' : `/${locale}`;

    mkdirSync(localeOutDir, { recursive: true });

    // 번역 파일 로드
    let translations: any = {};
    const userLocalePath = join(projectRoot, 'locales', `${locale}.json`);
    const defaultLocalePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../templates/scaffold/locales',
      `${locale}.json`
    );
    if (existsSync(userLocalePath)) {
      translations = JSON.parse(readFileSync(userLocalePath, 'utf-8'));
    } else if (existsSync(defaultLocalePath)) {
      translations = JSON.parse(readFileSync(defaultLocalePath, 'utf-8'));
    }
    
    const t = (key: string) => {
      const keys = key.split('.');
      let val = translations;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) val = val[k];
        else return key; // fallback
      }
      return val as string;
    };

    // 현재 언어의 포스트만 필터링 (미지정시 기본 언어로 간주)
    const localePostList = [...posts.values()]
      .filter((p) => (p.lang || defaultLocale) === locale)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // 이 언어의 posts Map
    const localePosts = new Map<string, Post>();
    localePostList.forEach(p => localePosts.set(p.slug, p));
    
    const localePostMetas: PostMeta[] = localePostList.map(toPostMeta);
    postsByLocale.set(locale, localePostMetas);

    const localePageList = [...pages.values()].filter(
      (p) => (p.lang || defaultLocale) === locale,
    );
    pagesByLocale.set(
      locale,
      localePageList.map((p) => p.slug),
    );
    const localePages = new Map<string, Post>();
    localePageList.forEach((p) => localePages.set(p.slug, p));

    const sidebar = buildSidebarData(localePostMetas, config, backlinkMap);

    const baseCtx = {
      site: config.site,
      theme: config.theme,
      taxonomy: config.taxonomy,
      sidebar,
      comments: config.comments,
      locale,
      defaultLocale,
      localePrefix,
      locales,
      t,
      siteUrl: config.site.url + localePrefix,
    };

    // 페이지 생성
    generateListPages({ outDir: localeOutDir, config, postMetas: localePostMetas, renderer, baseCtx });
    generatePostPages({ outDir: localeOutDir, config, posts: localePosts, postList: localePostList, backlinkMap, renderer, baseCtx });
    generateStaticPages({ outDir: localeOutDir, config, pages: localePages, renderer, baseCtx });
    generateTaxonomyPages({ outDir: localeOutDir, config, postMetas: localePostMetas, renderer, baseCtx });
    generateSeriesPages({ outDir: localeOutDir, config, postMetas: localePostMetas, renderer, baseCtx });
    generateRssFeeds({ outDir: localeOutDir, config, postMetas: localePostMetas, posts: localePosts });
    await generateOgImages({
      outDir: localeOutDir,
      config,
      postMetas: [...localePostMetas, ...localePageList.map(toPostMeta)],
    });
    
    const searchIndex = buildSearchIndex(localePostMetas);
    writeFileSync(join(localeOutDir, 'search-index.json'), searchIndex, 'utf-8');
    
    // 대시보드는 기본 언어에만 생성하거나, 각 언어별로 따로 만들 수 있습니다. 여기서는 각각 생성합니다.
    generateDashboard({ outDir: localeOutDir, config, postMetas: localePostMetas });
  }

  generateSeoArtifacts({ outDir, config, postsByLocale, pagesByLocale });

  console.log(
    `\x1b[32m✓ 다국어 빌드 완료: 총 ${posts.size}개 글` +
      (pages.size ? `, ${pages.size}개 고정 페이지` : '') +
      ` → ${config.build.output}/\x1b[0m`,
  );
}

