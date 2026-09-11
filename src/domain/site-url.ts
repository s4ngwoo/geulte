/**
 * Domain: 사이트 절대 URL 조합.
 * Adapters(FS, Nunjucks)에 의존하지 않는 순수 규칙.
 */

/** base와 path를 이어 절대 URL로 만든다. base trailing slash / path leading slash를 정규화한다. */
export function joinSiteUrl(baseUrl: string, path = ''): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (!path || path === '/') return base || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** path가 leading slash를 갖도록 정규화한다. 빈 값은 `/`. */
export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.startsWith('/') ? path.replace(/\/+$/, '') || '/' : `/${path.replace(/\/+$/, '')}`;
}
