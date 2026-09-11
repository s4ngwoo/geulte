import { joinSiteUrl } from '../../domain/site-url.js';

/** 기본 robots.txt — 전체 허용 + sitemap 절대 URL. */
export function buildRobotsTxt(siteUrl: string): string {
  const sitemap = joinSiteUrl(siteUrl, '/sitemap.xml');
  return `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
}
