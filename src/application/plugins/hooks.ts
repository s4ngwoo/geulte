import type { Post, SiteConfig } from '../../types.js';

export interface PluginContext {
  config: SiteConfig;
  projectRoot: string;
  outDir: string;
  posts: Map<string, Post>;
  pages: Map<string, Post>;
}

export interface GeultePlugin {
  name?: string;
  onConfig?: (config: SiteConfig, ctx: Pick<PluginContext, 'projectRoot'>) => SiteConfig | Promise<SiteConfig>;
  afterScan?: (ctx: PluginContext) => void | Promise<void>;
  afterGenerate?: (ctx: PluginContext) => void | Promise<void>;
}

export interface GeulteUserConfig {
  plugins?: GeultePlugin[];
}

/** 훅을 등록 순서대로 실행. 잘못된 훅은 메시지와 함께 throw. */
export async function runPluginHook(
  plugins: GeultePlugin[],
  hook: 'afterScan' | 'afterGenerate',
  ctx: PluginContext,
): Promise<void> {
  for (const plugin of plugins) {
    const fn = plugin[hook];
    if (!fn) continue;
    try {
      await fn(ctx);
    } catch (err) {
      const name = plugin.name ?? 'anonymous';
      throw new Error(`Plugin "${name}" ${hook} failed: ${(err as Error).message}`);
    }
  }
}

export async function applyOnConfigHooks(
  plugins: GeultePlugin[],
  config: SiteConfig,
  projectRoot: string,
): Promise<SiteConfig> {
  let next = config;
  for (const plugin of plugins) {
    if (!plugin.onConfig) continue;
    try {
      next = await plugin.onConfig(next, { projectRoot });
    } catch (err) {
      const name = plugin.name ?? 'anonymous';
      throw new Error(`Plugin "${name}" onConfig failed: ${(err as Error).message}`);
    }
  }
  return next;
}
