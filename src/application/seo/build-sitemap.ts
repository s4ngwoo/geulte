function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** urlset XML. urls는 이미 절대 URL. */
export function buildSitemapXml(urls: string[]): string {
  const unique = [...new Set(urls)];
  const body = unique
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
