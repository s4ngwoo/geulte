import MiniSearch from 'minisearch';
import type { PostMeta, SearchDoc } from '../types.js';

/**
 * MiniSearch 라이브러리를 사용하여 클라이언트 사이드 검색을 위한
 * 직렬화된 검색 인덱스 JSON 문자열을 생성한다.
 */
export function buildSearchIndex(posts: PostMeta[]): string {
  const ms = new MiniSearch<SearchDoc>({
    fields: ['title', 'excerpt', 'tags', 'category'],
    storeFields: ['title', 'slug', 'excerpt', 'date', 'tags', 'category'],
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
    },
  });

  const docs: SearchDoc[] = posts.map((p) => ({
    id: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    tags: p.tags,
    category: p.category,
    date: p.date.toISOString(),
    slug: p.slug,
  }));

  ms.addAll(docs);
  return JSON.stringify(ms.toJSON());
}
