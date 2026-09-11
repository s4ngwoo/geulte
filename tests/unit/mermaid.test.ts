import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseMarkdownFile } from '../../src/core/parser.js';

describe('mermaid pipeline', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('converts mermaid fences to pre.mermaid for client render', async () => {
    dir = mkdtempSync(join(tmpdir(), 'geulte-mermaid-'));
    const file = join(dir, 'diagram.md');
    writeFileSync(
      file,
      `---
title: Diagram
date: 2026-09-11
---

\`\`\`mermaid
graph TD
  A-->B
\`\`\`
`,
      'utf-8',
    );

    const { post } = await parseMarkdownFile(file, 'diagram', new Map());
    expect(post.contentHtml).toContain('class="mermaid"');
    expect(post.contentHtml).toContain('A-->B');
    expect(post.contentHtml).not.toContain('language-mermaid');
  });

  it('does not fail the build on empty mermaid block', async () => {
    dir = mkdtempSync(join(tmpdir(), 'geulte-mermaid-empty-'));
    const file = join(dir, 'empty.md');
    writeFileSync(
      file,
      `---
title: Empty
date: 2026-09-11
---

\`\`\`mermaid
\`\`\`
`,
      'utf-8',
    );

    const { post } = await parseMarkdownFile(file, 'empty', new Map());
    expect(post.contentHtml).toBeTruthy();
  });
});
