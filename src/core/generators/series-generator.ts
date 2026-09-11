import type { PostMeta, SiteConfig, BaseRenderContext } from '../../types.js';
import type { Renderer } from '../renderer.js';
import { groupSeries } from '../taxonomy.js';
import { writePage } from './page-writer.js';

export interface SeriesGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
  renderer: Renderer;
  baseCtx: BaseRenderContext;
}

/**
 * 시리즈 목록 인덱스 페이지(/series) 및 각 시리즈 상세 페이지(/series/{name}) 생성
 */
export function generateSeriesPages(opts: SeriesGeneratorOptions): void {
  const { outDir, config, postMetas, renderer, baseCtx } = opts;
  const seriesGroups = groupSeries(postMetas);

  const seriesItems = [...seriesGroups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, posts]) => ({
      name,
      count: posts.length,
      slug: `/series/${name}`,
    }));

  // 1. 시리즈 인덱스 페이지 (/series)
  const seriesIndexHtml = renderer.render('pages/taxonomy-index.njk', {
    ...baseCtx,
    pageTitle: `시리즈 — ${config.site.title}`,
    currentPath: '/series',
    listTitle: '시리즈',
    items: seriesItems,
    taxonomyType: 'series',
  });
  writePage(outDir, '/series', seriesIndexHtml);

  // 2. 개별 시리즈 상세 페이지 (/series/{name})
  for (const [seriesName, seriesPosts] of seriesGroups) {
    const seriesSlug = `/series/${seriesName}`;
    const html = renderer.render('pages/series.njk', {
      ...baseCtx,
      pageTitle: `${seriesName} 시리즈 — ${config.site.title}`,
      currentPath: seriesSlug,
      seriesName,
      posts: seriesPosts.sort((a, b) => a.date.getTime() - b.date.getTime()),
    });
    writePage(outDir, seriesSlug, html);
  }
}
