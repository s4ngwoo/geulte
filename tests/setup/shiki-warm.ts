/**
 * Shiki / highlighter 콜드스타트 완화.
 * 첫 테스트 전에 하이라이터를 한 번 로드해 이후 파일의 중복 초기화를 줄인다.
 */
import { createHighlighter } from 'shiki';

await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['typescript', 'javascript', 'text'],
});
