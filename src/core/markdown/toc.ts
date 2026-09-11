import { visit } from 'unist-util-visit';
import type { Element, Root, Text, Comment, Doctype } from 'hast';
import type { TocItem } from '../../types.js';

/**
 * rehype HAST 트리에서 h2~h4 헤더를 추출해 목차(TOC) 배열을 반환한다.
 */
export function extractToc(tree: Root): TocItem[] {
  const items: TocItem[] = [];
  visit(tree, 'element', (node: Element) => {
    if (/^h[234]$/.test(node.tagName)) {
      const depth = parseInt(node.tagName[1], 10);
      const id = (node.properties?.id as string) ?? '';
      const text = extractText(node);
      if (text) items.push({ depth, id, text });
    }
  });
  return items;
}

export function extractText(node: Element | Text | Comment | Root | Doctype): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) {
    return (node.children as typeof node[]).map(extractText).join('');
  }
  return '';
}
