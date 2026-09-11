/**
 * Domain: 표시용 텍스트를 글자 수 기준으로 줄바꿈.
 * OG 이미지·카드 등 Adapter가 공유하는 순수 규칙.
 */
export function wrapText(text: string, maxLen: number): string[] {
  if (maxLen <= 0) return text ? [text] : [];
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    current += char;
    if (current.length >= maxLen) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}
