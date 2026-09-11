import type {
  PostMeta,
  SiteConfig,
  SidebarData,
  TaxonomyItem,
  TagCloudItem,
  BacklinkMap,
} from '../types.js';

/**
 * 포스트 메타 배열에서 특정 배열 필드(tags, topics, keywords)의 빈도수를 집계하여
 * 내림차순 정렬된 TaxonomyItem 배열로 반환한다.
 */
export function aggregateTaxonomy(
  posts: PostMeta[],
  field: keyof Pick<PostMeta, 'tags' | 'topics' | 'keywords'>,
  basePath: string,
): TaxonomyItem[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const val of post[field] ?? []) {
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      slug: `${basePath}/${name}`,
    }));
}

/**
 * 포스트 메타 배열에서 단일 문자열 필드인 category 빈도수를 집계하여
 * 내림차순 정렬된 TaxonomyItem 배열로 반환한다.
 */
export function aggregateCategory(
  posts: PostMeta[],
  basePath: string,
): TaxonomyItem[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    if (post.category) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      slug: `${basePath}/${name}`,
    }));
}

/**
 * 포스트들을 시리즈별로 그룹화한다.
 */
export function groupSeries(posts: PostMeta[]): Map<string, PostMeta[]> {
  const seriesGroups = new Map<string, PostMeta[]>();
  for (const post of posts) {
    if (post.series) {
      if (!seriesGroups.has(post.series)) seriesGroups.set(post.series, []);
      seriesGroups.get(post.series)!.push(post);
    }
  }
  return seriesGroups;
}

/**
 * 태그 빈도수를 Min-Max 정규화하여 1~4 단계의 티어(tier)를 부여한다.
 * tier 1: 하위 25% (가장 작고 연함)
 * tier 2: 25% ~ 50%
 * tier 3: 50% ~ 75%
 * tier 4: 상위 25% (가장 크고 진함)
 */
export function computeTagCloud(tags: TaxonomyItem[]): TagCloudItem[] {
  if (tags.length === 0) return [];
  const counts = tags.map((t) => t.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return tags.map((tag) => {
    let tier: 1 | 2 | 3 | 4 = 2;
    if (max > min) {
      const norm = (tag.count - min) / (max - min);
      if (norm < 0.25) {
        tier = 1;
      } else if (norm < 0.5) {
        tier = 2;
      } else if (norm < 0.75) {
        tier = 3;
      } else {
        tier = 4;
      }
    }
    return {
      ...tag,
      tier,
    };
  });
}

/**
 * 사이드바 렌더링에 필요한 통합 데이터 생성
 */
export function buildSidebarData(
  posts: PostMeta[],
  config: SiteConfig,
  backlinkMap?: BacklinkMap,
): SidebarData {
  const tax = config.taxonomy;
  const tags = aggregateTaxonomy(posts, 'tags', tax.tags?.slug ?? '/tags');
  const tagCloud = computeTagCloud(tags);

  const recentCount = config.theme?.recentPosts?.count ?? 5;
  const recentPosts = [...posts]
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, recentCount);

  const popularMetric = config.theme?.popularPosts?.metric ?? 'backlinks';
  const popularCount = config.theme?.popularPosts?.count ?? 5;
  const nonDraftPosts = [...posts].filter((p) => !p.draft);

  let popularPosts: PostMeta[] = [];
  if (popularMetric === 'views') {
    popularPosts = nonDraftPosts
      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      .slice(0, popularCount);
  } else {
    // 기본: 백링크(다른 글로부터 언급된) 수 기준 정렬
    popularPosts = nonDraftPosts
      .map((p) => ({
        ...p,
        backlink_count: backlinkMap?.get(p.slug)?.length ?? 0,
      }))
      .sort((a, b) => {
        const countA = a.backlink_count ?? 0;
        const countB = b.backlink_count ?? 0;
        if (countB !== countA) return countB - countA;
        return b.date.getTime() - a.date.getTime();
      })
      .slice(0, popularCount);
  }

  return {
    categories: aggregateCategory(posts, tax.category?.slug ?? '/categories'),
    tags,
    tagCloud,
    topics: aggregateTaxonomy(posts, 'topics', tax.topics?.slug ?? '/topics'),
    keywords: aggregateTaxonomy(posts, 'keywords', tax.keywords?.slug ?? '/keywords'),
    recentPosts,
    popularPosts,
    series: [...new Set(posts.map((p) => p.series).filter(Boolean))] as string[],
  };
}
