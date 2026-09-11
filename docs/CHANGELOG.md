# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Test harness (`npm test` / Vitest) and local typecheck gate
- SEO: canonical links, `sitemap.xml`, `robots.txt`, BlogPosting JSON-LD
- Mermaid diagrams via client-side render (`pre.mermaid`)
- Shiki syntax highlighting and code copy button
- Live reload for `geulte dev` (SSE; not written into production `dist`)
- Static pages from `content/pages/` (`/{slug}/`)
- Frontmatter `description`, `cover` / `image` for SEO and social previews
- Optional image optimization (`build.images`) with sharp WebP/AVIF srcset
- Plugin hooks via `geulte.config.mjs` (`onConfig`, `afterScan`, `afterGenerate`)
- Framework CI workflow (test + typecheck)
- Package `.d.ts` generation via tsup (`dts: true`)

### Changed

- README KO/EN updated for pages, images, plugins, live reload, Shiki, and OG font note
- Root `implementation_plan.md` moved to private archive

### Fixed

- OG builtin font path when running from TypeScript source (tests / non-bundled)

### Notes

- `build.incremental` remains reserved (not implemented)
- OG image generation skips when the Noto Sans KR bold font is missing
