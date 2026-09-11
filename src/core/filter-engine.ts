import type { PostMeta } from '../types.js';

export interface FilterCriteria {
  tags?: string[];
  topics?: string[];
  keywords?: string[];
  category?: string | null;
  series?: string | null;
}

export interface FacetCounts {
  categories: Record<string, number>;
  series: Record<string, number>;
  tags: Record<string, number>;
  topics: Record<string, number>;
  keywords: Record<string, number>;
}

export interface FilterResult {
  posts: PostMeta[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets: FacetCounts;
}

/**
 * 단일 포스트가 주어진 다중 필터 조건에 부합하는지 검사한다.
 */
export function matchesCriteria(post: PostMeta, criteria: FilterCriteria): boolean {
  const { category, series, tags = [], topics = [], keywords = [] } = criteria;

  if (category && post.category !== category) return false;
  if (series && post.series !== series) return false;
  if (tags.length > 0 && !tags.every((t) => post.tags?.includes(t))) return false;
  if (topics.length > 0 && !topics.every((t) => post.topics?.includes(t))) return false;
  if (keywords.length > 0 && !keywords.every((k) => post.keywords?.includes(k))) return false;

  return true;
}

/**
 * 포스트 배열을 필터링 조건에 따라 필터링한다.
 */
export function filterPosts(posts: PostMeta[], criteria: FilterCriteria): PostMeta[] {
  return posts.filter((post) => matchesCriteria(post, criteria));
}

/**
 * 필터링된 포스트 목록을 바탕으로 동적 패싯(Facet) 빈도수를 집계한다.
 */
export function calculateFacets(posts: PostMeta[]): FacetCounts {
  const facets: FacetCounts = {
    categories: {},
    series: {},
    tags: {},
    topics: {},
    keywords: {},
  };

  for (const p of posts) {
    if (p.category) {
      facets.categories[p.category] = (facets.categories[p.category] || 0) + 1;
    }
    if (p.series) {
      facets.series[p.series] = (facets.series[p.series] || 0) + 1;
    }
    for (const t of p.tags || []) {
      facets.tags[t] = (facets.tags[t] || 0) + 1;
    }
    for (const top of p.topics || []) {
      facets.topics[top] = (facets.topics[top] || 0) + 1;
    }
    for (const k of p.keywords || []) {
      facets.keywords[k] = (facets.keywords[k] || 0) + 1;
    }
  }

  return facets;
}

/**
 * 페이징 및 Facet 집계를 포함하여 필터 쿼리를 완전하게 실행한다.
 */
export function executeFilter(
  allPosts: PostMeta[],
  criteria: FilterCriteria,
  page = 1,
  pageSize = 20,
): FilterResult {
  const filtered = filterPosts(allPosts, criteria);
  const offset = (page - 1) * pageSize;
  const paged = filtered.slice(offset, offset + pageSize);
  const facets = calculateFacets(filtered);

  return {
    posts: paged,
    total: filtered.length,
    page,
    pageSize,
    hasMore: offset + pageSize < filtered.length,
    facets,
  };
}
