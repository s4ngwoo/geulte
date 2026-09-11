// 글터(Geulte) 라이브러리 공개 API
export { scanContentDir, parseMarkdownFile, toSlug } from './core/parser.js';
export { buildBacklinkMap, findRelatedPosts, toPostMeta } from './core/backlinks.js';
export { build } from './core/builder.js';
export { syncPosts, syncBacklinks, cleanupOrphanPosts, SCHEMA_SQL } from './core/supabase.js';
export { Renderer } from './core/renderer.js';
export { FrontmatterSchema, SiteConfigSchema, validateFrontmatter } from './schema.js';
export { joinSiteUrl, normalizePath } from './domain/site-url.js';
export { wrapText } from './domain/wrap-text.js';
export { buildCanonical } from './application/seo/build-canonical.js';
export { buildSitemapXml } from './application/seo/build-sitemap.js';
export { buildRobotsTxt } from './application/seo/build-robots.js';
export { collectPublicPaths } from './application/seo/collect-public-paths.js';
export {
  applyOnConfigHooks,
  runPluginHook,
} from './application/plugins/hooks.js';
export type {
  GeultePlugin,
  GeulteUserConfig,
  PluginContext,
} from './application/plugins/hooks.js';
export type {
  Post,
  PostMeta,
  SiteConfig,
  TaxonomyConfig,
  BacklinkMap,
  RenderContext,
  SidebarData,
  TaxonomyItem,
  SearchDoc,
  TocItem,
} from './types.js';
