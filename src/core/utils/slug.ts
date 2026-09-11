import { createHash } from 'crypto';

/**
 * 파일명(확장자 제외) 또는 문자열을 URL-safe 슬러그로 변환한다.
 * 한글은 그대로 유지, 공백은 '-', 특수문자는 제거.
 */
export function toSlug(name: string): string {
  return name
    .normalize('NFC')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}


/**
 * 슬러그 중복을 처리한다. 중복 시 6자 해시 접미사를 추가한다.
 */
export function deduplicateSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  const hash = createHash('sha256').update(slug + Date.now()).digest('hex').slice(0, 6);
  return `${slug}-${hash}`;
}
