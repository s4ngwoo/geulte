import type { Post, SiteConfig, BacklinkMap, BaseRenderContext } from '../../types.js';
import type { Renderer } from '../renderer.js';
import { toPostMeta, findRelatedPosts } from '../backlinks.js';
import { writePage } from './page-writer.js';
import { resolveSeoDescription, resolveCoverImage } from '../../application/seo/resolve-meta.js';
import { joinSiteUrl } from '../../domain/site-url.js';

export interface PostGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  posts: Map<string, Post>;
  postList: Post[];
  backlinkMap: BacklinkMap;
  renderer: Renderer;
  baseCtx: BaseRenderContext;
}

/**
 * 모든 개별 포스트 상세 페이지(/posts/{slug}/) 생성
 */
export function generatePostPages(opts: PostGeneratorOptions): void {
  const { outDir, config, posts, postList, backlinkMap, renderer, baseCtx } = opts;

  for (const post of postList) {
    const related = findRelatedPosts(post, posts);
    const backlinks = backlinkMap.get(post.slug) ?? [];
    const seriesPosts = post.series
      ? postList
          .filter((p) => p.series === post.series)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
      : [];
    const seriesIndexRaw = seriesPosts.findIndex((p) => p.slug === post.slug);

    const seoDescription = resolveSeoDescription({
      description: post.description,
      excerpt: post.excerpt,
      siteDescription: config.site.description,
    });
    const coverImage = resolveCoverImage({
      cover: post.cover,
      image: post.image,
      generatedOgUrl: joinSiteUrl(config.site.url, `/og/${post.slug}.png`),
    });

    const html = renderer.render('pages/post.njk', {
      ...baseCtx,
      pageTitle: `${post.title} — ${config.site.title}`,
      currentPath: `/posts/${post.slug}`,
      post,
      seoDescription,
      coverImage,
      toc: post.toc,
      backlinks,
      related,
      seriesPosts,
      seriesIndex: seriesIndexRaw >= 0 ? seriesIndexRaw + 1 : null,
      seriesTotal: seriesPosts.length || null,
      prevPost: seriesIndexRaw > 0 ? toPostMeta(seriesPosts[seriesIndexRaw - 1]) : null,
      nextPost:
        seriesIndexRaw < seriesPosts.length - 1
          ? toPostMeta(seriesPosts[seriesIndexRaw + 1])
          : null,
      supabaseUrl: config.database?.url ?? '',
      supabaseKey: config.database?.key ?? '',
    });
    writePage(outDir, `/posts/${post.slug}`, html);
  }
}
