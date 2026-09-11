import { visit } from 'unist-util-visit';
import type { Root, PhrasingContent, Link } from 'mdast';
import { toSlug } from '../utils/slug.js';

export interface WikilinkPluginOptions {
  slugMap: Map<string, string>;
}

/**
 * remark 플러그인: [[wikilink]] 및 [[wikilink|alias]] 를 처리한다.
 * - 매칭된 wikilink는 <a class="wikilink"> 또는 <a class="wikilink broken"> 으로 변환
 * - slugMap: 제목/파일명 → slug 매핑 테이블 (사전에 계산)
 */
export function remarkWikiLinks(options: WikilinkPluginOptions) {
  return function (tree: Root) {
    const { slugMap } = options;

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return;

      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      const text = node.value;

      if (!wikilinkRegex.test(text)) return;

      const parts: PhrasingContent[] = [];
      let lastIndex = 0;
      wikilinkRegex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = wikilinkRegex.exec(text)) !== null) {
        // 앞쪽 일반 텍스트
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        const inner = match[1];
        const [target, alias] = inner.split('|').map((s) => s.trim());
        const displayText = alias ?? target;

        // 슬러그 조회 (제목 → slug 또는 파일명 → slug)
        const resolvedSlug =
          slugMap.get(target.toLowerCase()) ??
          slugMap.get(toSlug(target));

        const href = resolvedSlug ? `/posts/${resolvedSlug}` : undefined;
        const className = resolvedSlug ? 'wikilink' : 'wikilink broken';

        const linkNode: Link = {
          type: 'link',
          url: href ?? '#',
          data: {
            hProperties: {
              class: className,
              ...(resolvedSlug ? {} : { 'data-target': target }),
            },
          },
          children: [{ type: 'text', value: displayText }],
        };

        parts.push(linkNode);
        lastIndex = match.index + match[0].length;
      }

      // 뒤쪽 일반 텍스트
      if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
      }

      if (parts.length > 0 && parent.children) {
        parent.children.splice(index, 1, ...parts);
      }
    });
  };
}

/**
 * remark 플러그인: 파싱 전에 [[wikilinks]]만 추출하는 경량 플러그인.
 * outLinks 배열에 결과를 push한다.
 */
export function remarkCollectWikiLinks(outLinks: string[]) {
  return function (tree: Root) {
    visit(tree, 'text', (node) => {
      const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(node.value)) !== null) {
        outLinks.push(match[1].trim());
      }
    });
  };
}
