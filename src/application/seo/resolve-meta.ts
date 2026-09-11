/** SEO description: frontmatter description > excerpt > site fallback */
export function resolveSeoDescription(opts: {
  description?: string;
  excerpt?: string;
  siteDescription?: string;
}): string {
  const d = opts.description?.trim();
  if (d) return d;
  const e = opts.excerpt?.trim();
  if (e) return e;
  return opts.siteDescription?.trim() ?? '';
}

/** OG/cover image URL: cover > image > generated og path */
export function resolveCoverImage(opts: {
  cover?: string;
  image?: string;
  generatedOgUrl?: string;
}): string | undefined {
  const c = opts.cover?.trim() || opts.image?.trim();
  if (c) return c;
  return opts.generatedOgUrl;
}
