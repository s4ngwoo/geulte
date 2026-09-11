import type { Post, SiteConfig, BaseRenderContext } from '../../types.js';
import type { Renderer } from '../renderer.js';
import { writePage } from './page-writer.js';
import { resolveSeoDescription, resolveCoverImage } from '../../application/seo/resolve-meta.js';
import { joinSiteUrl } from '../../domain/site-url.js';

export interface PageGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  pages: Map<string, Post>;
  renderer: Renderer;
  baseCtx: BaseRenderContext;
}

/**
 * content/pages → /{slug}/index.html (고정 페이지). posts 목록·RSS에 포함되지 않음.
 */
export function generateStaticPages(opts: PageGeneratorOptions): void {
  const { outDir, config, pages, renderer, baseCtx } = opts;

  for (const page of pages.values()) {
    const seoDescription = resolveSeoDescription({
      description: page.description,
      excerpt: page.excerpt,
      siteDescription: config.site.description,
    });
    const cover = resolveCoverImage({
      cover: page.cover,
      image: page.image,
      generatedOgUrl: joinSiteUrl(config.site.url, `/og/${page.slug}.png`),
    });

    const html = renderer.render('pages/static.njk', {
      ...baseCtx,
      pageTitle: `${page.title} — ${config.site.title}`,
      currentPath: `/${page.slug}`,
      post: { ...page, excerpt: seoDescription },
      seoDescription,
      coverImage: cover,
      toc: page.toc,
    });
    writePage(outDir, `/${page.slug}`, html);
  }
}
