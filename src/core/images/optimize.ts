import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import type { Post, SiteConfig } from '../../types.js';
import {
  extractImgSrcs,
  planImageOptimization,
  rewriteImgTagForPlan,
} from '../../application/images/plan-optimize.js';

export interface ImageOptimizeOptions {
  projectRoot: string;
  outDir: string;
  config: SiteConfig;
  posts: Map<string, Post>;
  pages?: Map<string, Post>;
}

function resolveSourceFile(projectRoot: string, src: string): string | null {
  const clean = src.replace(/^\.\//, '').replace(/^\//, '');
  const candidates = [
    join(projectRoot, 'content', 'posts', clean),
    join(projectRoot, 'content', 'posts', 'assets', clean.replace(/^assets\//, '')),
    join(projectRoot, 'public', clean),
    join(projectRoot, clean),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

/**
 * Adapter: sharp로 로컬 이미지를 WebP 변형 생성하고 본문 HTML img를 srcset으로 교체.
 * config.build.images.enabled 가 false면 no-op.
 */
export async function optimizeContentImages(opts: ImageOptimizeOptions): Promise<number> {
  const images = opts.config.build.images;
  if (!images?.enabled) return 0;

  const widths = images.widths?.length ? images.widths : [640, 1280];
  const format = images.format ?? 'webp';
  const cacheDir = join(opts.projectRoot, '.geulte-cache', 'images');
  mkdirSync(cacheDir, { recursive: true });

  const { default: sharp } = await import('sharp');
  let rewritten = 0;

  const docs = [
    ...opts.posts.values(),
    ...(opts.pages ? opts.pages.values() : []),
  ];

  for (const doc of docs) {
    let html = doc.contentHtml;
    const srcs = extractImgSrcs(html);
    for (const src of srcs) {
      const plan = planImageOptimization(src, widths, format);
      if (plan.skip) continue;

      const sourceFile = resolveSourceFile(opts.projectRoot, src);
      if (!sourceFile) continue;

      const input = readFileSync(sourceFile);
      const hash = createHash('sha1').update(input).digest('hex').slice(0, 10);

      for (const variant of plan.variants) {
        const outAbs = join(opts.outDir, variant.outRel);
        mkdirSync(dirname(outAbs), { recursive: true });
        const cacheKey = join(cacheDir, `${hash}-${variant.width}.${format}`);
        if (existsSync(cacheKey)) {
          writeFileSync(outAbs, readFileSync(cacheKey));
        } else {
          const buf = await sharp(input)
            .resize({ width: variant.width, withoutEnlargement: true })
            .toFormat(format)
            .toBuffer();
          writeFileSync(cacheKey, buf);
          writeFileSync(outAbs, buf);
        }
      }

      const next = rewriteImgTagForPlan(html, plan);
      if (next !== html) {
        html = next;
        rewritten++;
      }
    }
    doc.contentHtml = html;
  }

  if (rewritten > 0) {
    console.log(`\x1b[32m✓ 이미지 최적화: ${rewritten}개 img 재작성\x1b[0m`);
  }
  return rewritten;
}

/** 테스트 헬퍼: 경로 resolve */
export function resolveImageSourceForTest(projectRoot: string, src: string): string | null {
  return resolveSourceFile(resolve(projectRoot), src);
}
