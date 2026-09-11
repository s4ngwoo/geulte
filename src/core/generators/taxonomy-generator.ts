import type { PostMeta, SiteConfig, TaxonomyItem, BaseRenderContext } from '../../types.js';
import type { Renderer } from '../renderer.js';
import { aggregateCategory, aggregateTaxonomy } from '../taxonomy.js';
import { writePage } from './page-writer.js';

export interface TaxonomyGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
  renderer: Renderer;
  baseCtx: BaseRenderContext;
}

interface TaxonomyRule {
  type: 'categories' | 'tags' | 'topics' | 'keywords';
  listType: 'category' | 'tag' | 'topic' | 'keyword';
  label: string;
  basePath: string;
  hasIndexPage: boolean;
  getItems: (posts: PostMeta[], basePath: string) => TaxonomyItem[];
  filterPosts: (post: PostMeta, itemName: string) => boolean;
}

/**
 * 카테고리, 태그, 주제(topics), 키워드 분류 인덱스 및 상세 목록 페이지를 일관되게 생성한다.
 */
export function generateTaxonomyPages(opts: TaxonomyGeneratorOptions): void {
  const { outDir, config, postMetas, renderer, baseCtx } = opts;
  const tax = config.taxonomy;

  const rules: TaxonomyRule[] = [
    {
      type: 'categories',
      listType: 'category',
      label: tax.category?.label ?? '카테고리',
      basePath: tax.category?.slug ?? '/categories',
      hasIndexPage: true,
      getItems: (posts, bp) => aggregateCategory(posts, bp),
      filterPosts: (post, name) => post.category === name,
    },
    {
      type: 'tags',
      listType: 'tag',
      label: tax.tags?.label ?? '태그',
      basePath: tax.tags?.slug ?? '/tags',
      hasIndexPage: true,
      getItems: (posts, bp) => aggregateTaxonomy(posts, 'tags', bp),
      filterPosts: (post, name) => post.tags.includes(name),
    },
    {
      type: 'topics',
      listType: 'topic',
      label: tax.topics?.label ?? '주제',
      basePath: tax.topics?.slug ?? '/topics',
      hasIndexPage: true,
      getItems: (posts, bp) => aggregateTaxonomy(posts, 'topics', bp),
      filterPosts: (post, name) => post.topics.includes(name),
    },
    {
      type: 'keywords',
      listType: 'keyword',
      label: tax.keywords?.label ?? '키워드',
      basePath: tax.keywords?.slug ?? '/keywords',
      hasIndexPage: true,
      getItems: (posts, bp) => aggregateTaxonomy(posts, 'keywords', bp),
      filterPosts: (post, name) => post.keywords.includes(name),
    },
  ];

  for (const rule of rules) {
    const items = rule.getItems(postMetas, rule.basePath);

    // 1. 분류 인덱스 페이지 (ex: /tags, /categories)
    if (rule.hasIndexPage) {
      const indexHtml = renderer.render('pages/taxonomy-index.njk', {
        ...baseCtx,
        pageTitle: `${rule.label} — ${config.site.title}`,
        currentPath: rule.basePath,
        listTitle: rule.label,
        items,
        taxonomyType: rule.type,
      });
      writePage(outDir, rule.basePath, indexHtml);
    }

    // 2. 분류별 개별 글 목록 페이지 (ex: /tags/React, /categories/Frontend)
    for (const item of items) {
      const matchedPosts = postMetas.filter((p) => rule.filterPosts(p, item.name));
      const pageTitle = rule.listType === 'tag' ? `#${item.name}` : item.name;

      const html = renderer.render('pages/list.njk', {
        ...baseCtx,
        pageTitle: `${pageTitle} — ${config.site.title}`,
        currentPath: item.slug,
        listTitle: pageTitle,
        posts: matchedPosts,
        listType: rule.listType,
        currentTaxonomy: item.name,
      });
      writePage(outDir, item.slug, html);
    }
  }
}
