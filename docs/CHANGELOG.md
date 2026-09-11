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
- User docs under `docs/` (getting started, how it works, writing, deploy layers, config, glossary, friendly FAQ)
- Step-by-step tutorials: local testing, Supabase setup, Vercel deploy (`docs/tutorials/`)

### Changed

- README KO/EN honesty pass: `build.incremental` reserved/unimplemented, plugin hook scope, scaffold `about` page, combination filter runtime (`geulte dev` / Vercel `/api/filter`)
- Root `implementation_plan.md` moved to private archive

### Fixed

- OG builtin font path when running from TypeScript source (tests / non-bundled)
- Combination filter: inject `allSeries` into `__GEULTE_FILTER__`; enable panel on `/posts` without requiring a truthy `database.url`

### Notes

- `build.incremental` remains reserved (not implemented)
- OG image generation skips when the Noto Sans KR bold font is missing
- npm publish still deferred pending a deliberate release cut
