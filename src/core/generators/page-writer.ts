import { mkdirSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * 주어진 상대 URL 경로에 대응하는 index.html 파일을 생성한다.
 * 예: '/posts/my-slug' → 'dist/posts/my-slug/index.html'
 */
export function writePage(outDir: string, urlPath: string, html: string): void {
  const filePath = join(outDir, urlPath.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html, 'utf-8');
}

/**
 * 디렉터리를 재귀적으로 복사한다.
 */
export function copyDir(src: string, dest: string): void {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
