import { readdirSync, readFileSync } from 'fs';
import { join, basename, extname } from 'path';
import matter from 'gray-matter';
import type { Post } from '../types.js';
import { toSlug, deduplicateSlug } from './utils/slug.js';
import { parseMarkdownFile } from './parser.js';

export interface ScanResult {
  /** 슬러그 → Post 맵 (blog posts) */
  posts: Map<string, Post>;
  /** 슬러그 → Post 맵 (content/pages — URL /{slug}) */
  pages: Map<string, Post>;
  /** 제목(소문자)/파일명(소문자) → 슬러그 맵 (wikilink 해석용) */
  slugMap: Map<string, string>;
}

/**
 * 디렉터리를 재귀 탐색하여 모든 .md 파일의 절대 경로 목록을 수집한다.
 */
export function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch {
    // 디렉토리가 없으면 빈 배열 반환
  }
  return files;
}

/**
 * `contentDir/posts/` + `contentDir/pages/` 를 스캔한다.
 * pages는 글 목록/RSS에 섞이지 않는 고정 페이지용.
 */
export async function scanContentDir(contentDir: string): Promise<ScanResult> {
  const slugMap = new Map<string, string>();
  const usedSlugs = new Set<string>();

  const posts = await scanMarkdownFolder(join(contentDir, 'posts'), slugMap, usedSlugs);
  const pages = await scanMarkdownFolder(join(contentDir, 'pages'), slugMap, usedSlugs);

  return { posts, pages, slugMap };
}

async function scanMarkdownFolder(
  dir: string,
  slugMap: Map<string, string>,
  usedSlugs: Set<string>,
): Promise<Map<string, Post>> {
  const mdFiles = collectMarkdownFiles(dir);
  const fileSlugPairs: Array<{ filePath: string; slug: string }> = [];

  for (const filePath of mdFiles) {
    const name = basename(filePath, extname(filePath));
    let slug = toSlug(name);
    slug = deduplicateSlug(slug, usedSlugs);
    usedSlugs.add(slug);

    slugMap.set(name.toLowerCase(), slug);
    slugMap.set(slug, slug);
    slugMap.set(toSlug(name), slug);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const { data } = matter(raw);
      if (data && typeof data.title === 'string' && data.title.trim()) {
        const postTitle = data.title.trim();
        slugMap.set(postTitle.toLowerCase(), slug);
        slugMap.set(toSlug(postTitle), slug);
      }
    } catch {
      // 1패스 추출 실패는 2패스에서 상세 처리
    }

    fileSlugPairs.push({ filePath, slug });
  }

  const result = new Map<string, Post>();

  for (const { filePath, slug } of fileSlugPairs) {
    try {
      const { post } = await parseMarkdownFile(filePath, slug, slugMap);
      if (post.title) {
        slugMap.set(post.title.toLowerCase(), slug);
      }
      if (!post.draft) {
        result.set(slug, post);
      }
    } catch (err) {
      console.warn(`\x1b[33m⚠  파싱 실패 [${filePath}]: ${(err as Error).message}\x1b[0m`);
    }
  }

  return result;
}
