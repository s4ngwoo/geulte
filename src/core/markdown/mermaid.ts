import type { Root, Element, ElementContent } from 'hast';
import { visitParents } from 'unist-util-visit-parents';
import { toString } from 'hast-util-to-string';

function hasLanguageMermaid(node: Element): boolean {
  const raw = node.properties?.className;
  const classes: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) classes.push(String(item));
  } else if (raw != null) {
    classes.push(...String(raw).split(/\s+/));
  }
  return classes.includes('language-mermaid');
}

/**
 * Adapter: ` ```mermaid ` → `<pre class="mermaid">…</pre>` (클라이언트 렌더용).
 * Playwright/빌드타임 SVG 없이 동작. 변환 중 예외 시 원본 코드 블록 유지.
 */
export function rehypeMermaidBlocks() {
  return (tree: Root) => {
    visitParents(tree, 'element', (node, ancestors) => {
      if (node.tagName !== 'code' || !hasLanguageMermaid(node)) return;

      const pre = ancestors.at(-1);
      if (!pre || pre.type !== 'element' || pre.tagName !== 'pre') return;

      const container = ancestors.at(-2);
      if (!container || !('children' in container)) return;

      try {
        const diagram = toString(node);
        const replacement: Element = {
          type: 'element',
          tagName: 'pre',
          properties: { className: ['mermaid'] },
          children: [{ type: 'text', value: diagram }],
        };
        const children = container.children as ElementContent[];
        const idx = children.indexOf(pre as ElementContent);
        if (idx >= 0) children[idx] = replacement;
      } catch {
        // keep original fence — build must not fail
      }
    });
  };
}
