import { joinSiteUrl } from '../../domain/site-url.js';

/** 페이지 canonical 절대 URL. root는 trailing slash 없이 base만. */
export function buildCanonical(siteUrl: string, path: string): string {
  return joinSiteUrl(siteUrl, path === '/' ? '' : path);
}
