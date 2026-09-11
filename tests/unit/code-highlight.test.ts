import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseMarkdownFile } from '../../src/core/parser.js';

describe('code highlighting', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('highlights known languages with shiki markup', async () => {
    dir = mkdtempSync(join(tmpdir(), 'geulte-shiki-'));
    const file = join(dir, 'code.md');
    writeFileSync(
      file,
      `---
title: Code
date: 2026-09-11
---

\`\`\`ts
const x: number = 1;
\`\`\`
`,
      'utf-8',
    );

    const { post } = await parseMarkdownFile(file, 'code', new Map());
    expect(post.contentHtml).toMatch(/shiki|astro-code|highlighted/);
    expect(post.contentHtml).toContain('const');
  });

  it('does not fail build on unknown language', async () => {
    dir = mkdtempSync(join(tmpdir(), 'geulte-shiki-unk-'));
    const file = join(dir, 'unk.md');
    writeFileSync(
      file,
      `---
title: Unknown
date: 2026-09-11
---

\`\`\`not-a-real-lang-xyz
foo bar
\`\`\`
`,
      'utf-8',
    );

    const { post } = await parseMarkdownFile(file, 'unk', new Map());
    expect(post.contentHtml).toContain('foo bar');
  });
});
