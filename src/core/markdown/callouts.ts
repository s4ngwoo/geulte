import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export const CALLOUT_TYPES = ['NOTE', 'WARNING', 'TIP', 'IMPORTANT', 'CAUTION', 'INFO', 'SUCCESS', 'DANGER'] as const;
export type CalloutType = typeof CALLOUT_TYPES[number];

export const CALLOUT_ICONS: Record<CalloutType, string> = {
  NOTE: '📝', WARNING: '⚠️', TIP: '💡', IMPORTANT: '❗',
  CAUTION: '🔥', INFO: 'ℹ️', SUCCESS: '✅', DANGER: '💀',
};

/**
 * remark 플러그인: > [!NOTE] 스타일 Obsidian / GitHub 콜아웃을 파싱하여 div.callout 노드로 변환한다.
 */
export function remarkCallouts() {
  return function (tree: Root) {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!parent || index === undefined) return;

      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      const firstText = firstChild.children[0];
      if (!firstText || firstText.type !== 'text') return;

      const calloutMatch = firstText.value.match(/^\[!([\w]+)\]\s*(.*)?/);
      if (!calloutMatch) return;

      const type = calloutMatch[1].toUpperCase() as CalloutType;
      const title = calloutMatch[2]?.trim() || type;
      const icon = CALLOUT_ICONS[type] ?? '📌';

      // 첫 줄에서 callout 헤더 제거
      const remainingText = firstText.value.replace(/^\[![\w]+\]\s*[^\n]*/, '').trim();
      if (remainingText) {
        firstText.value = remainingText;
      } else {
        firstChild.children.shift();
        if (firstChild.children.length === 0) {
          node.children.shift();
        }
      }

      // HTML 노드로 변환
      const htmlNode = {
        type: 'html' as const,
        value: `<div class="callout callout-${type.toLowerCase()}" data-type="${type}">
<div class="callout-title"><span class="callout-icon">${icon}</span>${title}</div>
<div class="callout-body">`,
      } as unknown as Parameters<typeof parent.children.splice>[2];

      const closingNode = {
        type: 'html' as const,
        value: '</div></div>',
      } as unknown as Parameters<typeof parent.children.splice>[2];

      parent.children.splice(index, 1, htmlNode, ...node.children, closingNode);
    });
  };
}
