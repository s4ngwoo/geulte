export interface CollectPostInput {
  slug: string;
  draft?: boolean;
  tags?: string[];
  topics?: string[];
  keywords?: string[];
  category?: string;
  series?: string;
}

export interface CollectPublicPathsInput {
  /** '' for default locale, '/en' for others */
  localePrefix: string;
  posts: CollectPostInput[];
  /** fixed pages under /{slug} (not under /posts) */
  staticPageSlugs?: string[];
  taxonomyBase: {
    tags?: string;
    topics?: string;
    keywords?: string;
    category?: string;
  };
}

function withPrefix(localePrefix: string, path: string): string {
  if (!localePrefix) return path === '/' ? '/' : path;
  if (path === '/') return localePrefix;
  return `${localePrefix}${path}`;
}

/**
 * 공개 HTML 페이지 경로 목록 (leading slash, trailing slash 없음; root는 `/` 또는 `/en`).
 * dashboard·draft 제외.
 */
export function collectPublicPaths(input: CollectPublicPathsInput): string[] {
  const { localePrefix, posts, taxonomyBase, staticPageSlugs = [] } = input;
  const published = posts.filter((p) => !p.draft);
  const paths = new Set<string>();

  paths.add(withPrefix(localePrefix, '/'));
  paths.add(withPrefix(localePrefix, '/posts'));

  for (const post of published) {
    paths.add(withPrefix(localePrefix, `/posts/${post.slug}`));
  }

  for (const slug of staticPageSlugs) {
    paths.add(withPrefix(localePrefix, `/${slug}`));
  }

  const tagBase = taxonomyBase.tags ?? '/tags';
  const topicBase = taxonomyBase.topics ?? '/topics';
  const kwBase = taxonomyBase.keywords ?? '/keywords';
  const catBase = taxonomyBase.category ?? '/categories';

  const tags = new Set<string>();
  const topics = new Set<string>();
  const keywords = new Set<string>();
  const categories = new Set<string>();
  const series = new Set<string>();

  for (const post of published) {
    for (const t of post.tags ?? []) tags.add(t);
    for (const t of post.topics ?? []) topics.add(t);
    for (const k of post.keywords ?? []) keywords.add(k);
    if (post.category) categories.add(post.category);
    if (post.series) series.add(post.series);
  }

  paths.add(withPrefix(localePrefix, tagBase));
  for (const t of tags) paths.add(withPrefix(localePrefix, `${tagBase}/${t}`));

  paths.add(withPrefix(localePrefix, topicBase));
  for (const t of topics) paths.add(withPrefix(localePrefix, `${topicBase}/${t}`));

  paths.add(withPrefix(localePrefix, kwBase));
  for (const k of keywords) paths.add(withPrefix(localePrefix, `${kwBase}/${k}`));

  paths.add(withPrefix(localePrefix, catBase));
  for (const c of categories) paths.add(withPrefix(localePrefix, `${catBase}/${c}`));

  paths.add(withPrefix(localePrefix, '/series'));
  for (const s of series) paths.add(withPrefix(localePrefix, `/series/${s}`));

  return [...paths].sort();
}
