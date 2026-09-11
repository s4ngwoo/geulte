import nunjucks from 'nunjucks';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { RenderContext } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 기본 내장 테마 경로 (패키지 내부)
const BUILT_IN_TEMPLATES_DIR = resolve(__dirname, '../../templates/theme');

/**
 * Nunjucks 렌더링 엔진 래퍼.
 *
 * 템플릿 검색 순서:
 * 1. 사용자 프로젝트의 `templates/` (커스터마이징 허용)
 * 2. 글터 패키지 내장 `templates/theme/`
 */
export class Renderer {
  private env: nunjucks.Environment;

  constructor(projectRoot: string) {
    const userTemplatesDir = join(projectRoot, 'templates');

    // 두 경로를 모두 검색하는 FileSystemLoader
    const loader = new nunjucks.FileSystemLoader(
      [userTemplatesDir, BUILT_IN_TEMPLATES_DIR],
      { noCache: process.env.NODE_ENV !== 'production' },
    );

    this.env = new nunjucks.Environment(loader, {
      autoescape: true,
      throwOnUndefined: false,
    });

    this.registerFilters();
  }

  /** 전역 필터 등록 */
  private registerFilters() {
    // 날짜 포맷 필터 (ISO → 'YYYY.MM.DD')
    this.env.addFilter('dateformat', (date: Date | string, format = 'YYYY.MM.DD') => {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return format
        .replace('YYYY', String(d.getFullYear()))
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(d.getDate()).padStart(2, '0'));
    });

    // 날짜 ISO 문자열 필터
    this.env.addFilter('isodate', (date: Date | string) => {
      const d = date instanceof Date ? date : new Date(date);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    });

    // 슬러그 → URL 인코딩
    this.env.addFilter('urlencode', (s: string) => encodeURIComponent(s));

    // 배열 → 첫 N개 슬라이스
    this.env.addFilter('first', (arr: unknown[], n = 1) =>
      Array.isArray(arr) ? arr.slice(0, n) : [],
    );

    // 문자열 자르기
    this.env.addFilter('truncate', (s: string, len = 100) => {
      if (typeof s !== 'string') return '';
      return s.length > len ? s.slice(0, len) + '…' : s;
    });

    // JSON 직렬화 (인라인 스크립트용)
    this.env.addFilter('tojson', (v: unknown) => JSON.stringify(v));

    // 안전한 HTML 마크업 (autoescape 우회)
    this.env.addFilter('safe', (s: string) => new nunjucks.runtime.SafeString(s));

    // 배열에서 최솟값
    this.env.addFilter('min', (arr: number[]) => {
      if (!Array.isArray(arr)) return arr;
      return Math.min(...arr);
    });

    // 배열에서 최댓값
    this.env.addFilter('max', (arr: number[]) => {
      if (!Array.isArray(arr)) return arr;
      return Math.max(...arr);
    });
  }

  /**
   * 템플릿을 렌더링해 HTML 문자열을 반환한다.
   * @param template 템플릿 경로 (ex: 'pages/post.njk')
   * @param context 렌더링 컨텍스트
   */
  render(template: string, context: Record<string, unknown>): string {
    return this.env.render(template, context);
  }

  /**
   * 문자열 템플릿을 직접 렌더링한다 (소규모 인라인 렌더링용).
   */
  renderString(templateStr: string, context: Record<string, unknown>): string {
    return this.env.renderString(templateStr, context);
  }
}
