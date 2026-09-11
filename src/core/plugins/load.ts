import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { GeultePlugin, GeulteUserConfig } from '../../application/plugins/hooks.js';

/**
 * 프로젝트 루트의 geulte.config.{js,mjs,ts} 를 로드한다.
 * 없으면 빈 플러그인 목록.
 */
export async function loadUserPlugins(projectRoot: string): Promise<GeultePlugin[]> {
  const candidates = ['geulte.config.mjs', 'geulte.config.js'];
  for (const name of candidates) {
    const full = join(projectRoot, name);
    if (!existsSync(full)) continue;
    const mod = await import(pathToFileURL(full).href);
    const cfg = (mod.default ?? mod) as GeulteUserConfig;
    return Array.isArray(cfg.plugins) ? cfg.plugins : [];
  }
  return [];
}
