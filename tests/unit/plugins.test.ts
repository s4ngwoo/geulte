import { describe, expect, it } from 'vitest';
import {
  applyOnConfigHooks,
  runPluginHook,
  type GeultePlugin,
  type PluginContext,
} from '../../src/application/plugins/hooks.js';
import type { SiteConfig } from '../../src/types.js';

function baseConfig(): SiteConfig {
  return {
    site: { title: 'T', url: 'https://t.example' },
    taxonomy: {},
    theme: { darkMode: true, sidebar: 'left', toc: 'right' },
    build: { output: 'dist' },
    i18n: { defaultLocale: 'ko', locales: [{ code: 'ko', label: '한국어' }] },
  };
}

describe('plugin hooks', () => {
  it('runs afterGenerate in registration order', async () => {
    const order: string[] = [];
    const plugins: GeultePlugin[] = [
      { name: 'a', afterGenerate: async () => { order.push('a'); } },
      { name: 'b', afterGenerate: async () => { order.push('b'); } },
    ];
    const ctx = {
      config: baseConfig(),
      projectRoot: '/tmp',
      outDir: '/tmp/dist',
      posts: new Map(),
      pages: new Map(),
    } satisfies PluginContext;
    await runPluginHook(plugins, 'afterGenerate', ctx);
    expect(order).toEqual(['a', 'b']);
  });

  it('wraps plugin errors with name', async () => {
    const plugins: GeultePlugin[] = [
      {
        name: 'boom',
        afterScan: async () => {
          throw new Error('nope');
        },
      },
    ];
    const ctx = {
      config: baseConfig(),
      projectRoot: '/tmp',
      outDir: '/tmp/dist',
      posts: new Map(),
      pages: new Map(),
    } satisfies PluginContext;
    await expect(runPluginHook(plugins, 'afterScan', ctx)).rejects.toThrow(
      /Plugin "boom" afterScan failed: nope/,
    );
  });

  it('applyOnConfigHooks can mutate title', async () => {
    const plugins: GeultePlugin[] = [
      {
        name: 'rename',
        onConfig: (c) => ({ ...c, site: { ...c.site, title: 'Renamed' } }),
      },
    ];
    const next = await applyOnConfigHooks(plugins, baseConfig(), '/tmp');
    expect(next.site.title).toBe('Renamed');
  });
});
