import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { PostMeta, SiteConfig, BaseRenderContext } from '../../types.js';
import type { Renderer } from '../renderer.js';
import { writePage } from './page-writer.js';

export interface ListGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
  renderer: Renderer;
  baseCtx: BaseRenderContext;
}

/**
 * 메인 홈 페이지, 전체 글 목록 페이지 및 모의 필터용 posts.json 생성
 */
export function generateListPages(opts: ListGeneratorOptions): void {
  const { outDir, config, postMetas, renderer, baseCtx } = opts;

  // 1. 홈 페이지 (/index.html)
  const homeHtml = renderer.render('pages/index.njk', {
    ...baseCtx,
    pageTitle: config.site.title,
    currentPath: '/',
    posts: postMetas,
  });
  writeFileSync(join(outDir, 'index.html'), homeHtml, 'utf-8');

  // 2. 전체 글 목록 페이지 (/posts/)
  const postsListHtml = renderer.render('pages/list.njk', {
    ...baseCtx,
    pageTitle: `글 목록 — ${config.site.title}`,
    currentPath: '/posts',
    listTitle: '모든 글',
    posts: postMetas,
    listType: 'posts',
    supabaseUrl: config.database?.url ?? '',
    supabaseKey: config.database?.key ?? '',
  });
  writePage(outDir, '/posts', postsListHtml);

  // 3. 로컬 개발 서버 및 모의 필터용 posts.json 저장
  const dataDir = join(outDir, '_geulte/data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'posts.json'), JSON.stringify(postMetas), 'utf-8');
}
