import type { Post, PostMeta, BacklinkMap } from '../types.js';

/**
 * 모든 글의 outLinks를 분석해 백링크 그래프를 구성한다.
 *
 * 결과: targetSlug → 해당 글을 링크한 소스 Post 목록
 *
 * @example
 * 글 A가 [[글 B]]를 참조하면 backlinkMap.get('글-b') = [PostMeta(A)]
 */
export function buildBacklinkMap(posts: Map<string, Post>): BacklinkMap {
  const backlinkMap: BacklinkMap = new Map();

  for (const [sourceSlug, post] of posts) {
    // 중복 링크 제거 (같은 글에서 동일 slug를 여러 번 링크해도 1회만 카운트)
    const uniqueTargets = new Set(post.outLinks);

    for (const targetSlug of uniqueTargets) {
      if (targetSlug === sourceSlug) continue; // 자기 참조 무시

      if (!backlinkMap.has(targetSlug)) {
        backlinkMap.set(targetSlug, []);
      }

      const sourceMeta = toPostMeta(post);
      backlinkMap.get(targetSlug)!.push(sourceMeta);
    }
  }

  return backlinkMap;
}

/**
 * Post에서 백링크 섹션에 필요한 PostMeta만 추출한다.
 * (contentHtml, outLinks 같은 무거운 필드 제외)
 */
export function toPostMeta(post: Post): PostMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    updated: post.updated,
    tags: post.tags,
    topics: post.topics,
    keywords: post.keywords,
    category: post.category,
    type: post.type,
    series: post.series,
    lang: post.lang,
    draft: post.draft,
    description: post.description,
    cover: post.cover,
    image: post.image,
    filePath: post.filePath,
    excerpt: post.excerpt,
  };
}

/**
 * 백링크 맵을 Supabase upsert용 배열로 직렬화한다.
 */
export function serializeBacklinks(
  backlinkMap: BacklinkMap,
): Array<{ slug: string; target_slug: string }> {
  const rows: Array<{ slug: string; target_slug: string }> = [];

  for (const [targetSlug, sources] of backlinkMap) {
    for (const source of sources) {
      rows.push({ slug: source.slug, target_slug: targetSlug });
    }
  }

  return rows;
}

/**
 * 연관 글을 계산한다: 태그/카테고리/토픽이 겹치는 글을 점수 순으로 반환.
 */
export function findRelatedPosts(
  post: Post,
  allPosts: Map<string, Post>,
  limit = 5,
): PostMeta[] {
  const scores = new Map<string, number>();

  for (const [slug, other] of allPosts) {
    if (slug === post.slug) continue;

    let score = 0;

    // 카테고리 일치: 3점
    if (post.category && post.category === other.category) score += 3;

    // 시리즈 일치: 5점
    if (post.series && post.series === other.series) score += 5;

    // 태그 교집합: 태그당 2점
    const tagIntersect = post.tags.filter((t) => other.tags.includes(t));
    score += tagIntersect.length * 2;

    // 토픽 교집합: 토픽당 2점
    const topicIntersect = post.topics.filter((t) => other.topics.includes(t));
    score += topicIntersect.length * 2;

    // 키워드 교집합: 키워드당 1점
    const kwIntersect = post.keywords.filter((k) => other.keywords.includes(k));
    score += kwIntersect.length;

    if (score > 0) scores.set(slug, score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => toPostMeta(allPosts.get(slug)!));
}
