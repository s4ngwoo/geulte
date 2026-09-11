import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import { readFileSync, statSync } from 'fs';
import { basename, extname } from 'path';
import type { Post, TocItem } from '../types.js';
import { validateFrontmatter } from '../schema.js';
import { toSlug, deduplicateSlug } from './utils/slug.js';
import { extractToc } from './markdown/toc.js';
import { remarkCallouts } from './markdown/callouts.js';
import { remarkWikiLinks, remarkCollectWikiLinks } from './markdown/wikilink.js';
import { rehypeMermaidBlocks } from './markdown/mermaid.js';
import rehypeShiki from '@shikijs/rehype';

// 하위 호환성을 위한 재수출
export { toSlug, deduplicateSlug } from './utils/slug.js';
export { scanContentDir, type ScanResult } from './scanner.js';

export interface ParseResult {
  post: Post;
  rawWikiLinks: string[]; // 슬러그 변환 전 raw wikilink 대상 목록
}

/**
 * 단일 마크다운 파일을 파싱하여 Post 객체로 변환한다.
 * @param filePath 절대 파일 경로
 * @param slug 이미 계산된 고유 슬러그
 * @param slugMap 제목/파일명 → slug 매핑 (wikilink 상호 연결용)
 */
export async function parseMarkdownFile(
  filePath: string,
  slug: string,
  slugMap: Map<string, string>,
): Promise<ParseResult> {
  const raw = readFileSync(filePath, 'utf-8');
  const { data: rawFrontmatter, content: markdownContent } = matter(raw);

  const fm = validateFrontmatter(rawFrontmatter, filePath);

  // 제목: frontmatter > 파일명에서 추출
  const title =
    fm.title ??
    toSlug(basename(filePath, extname(filePath)))
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // 날짜: frontmatter > 파일 수정시간
  const date =
    fm.date ??
    (() => {
      try {
        return statSync(filePath).mtime;
      } catch {
        return new Date();
      }
    })();

  // wikilink 수집 (슬러그 변환 전)
  const rawWikiLinks: string[] = [];

  // TOC 추출 참조
  let tocItems: TocItem[] = [];

  // Unified 처리 파이프라인 조립
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkCallouts)
    .use(remarkCollectWikiLinks, rawWikiLinks)
    .use(remarkWikiLinks, { slugMap })
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeMermaidBlocks)
    .use(rehypeShiki, {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      // 알 수 없는 언어는 plaintext로 — 빌드 실패 금지
      defaultLanguage: 'text',
      fallbackLanguage: 'text',
    })
    .use(rehypeSlug)
    .use(() => (tree: import('hast').Root) => {
      tocItems = extractToc(tree);
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const vfile = await processor.process(markdownContent);
  const contentHtml = String(vfile);

  // 발췌문: HTML 태그 제거 후 첫 200자
  const excerpt = contentHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  // wikilink 대상을 slug로 변환 (알 수 없는 건 raw 이름 그대로 보관)
  const outLinks = rawWikiLinks
    .map((target) => slugMap.get(target.toLowerCase()) ?? slugMap.get(toSlug(target)) ?? toSlug(target))
    .filter(Boolean);

  const post: Post = {
    slug,
    title,
    date,
    updated: fm.updated,
    tags: fm.tags,
    topics: fm.topics,
    keywords: fm.keywords,
    category: fm.category,
    type: fm.type,
    series: fm.series,
    lang: fm.lang,
    draft: fm.draft,
    description: fm.description,
    cover: fm.cover,
    image: fm.image,
    filePath,
    excerpt,
    contentHtml,
    outLinks,
    toc: tocItems,
  };

  return { post, rawWikiLinks };
}
