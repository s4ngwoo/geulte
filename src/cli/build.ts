import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import { scanContentDir } from '../core/parser.js';
import { buildBacklinkMap } from '../core/backlinks.js';
import { build } from '../core/builder.js';
import { syncPosts, syncBacklinks, cleanupOrphanPosts } from '../core/supabase.js';
import { SiteConfigSchema } from '../schema.js';
import { loadUserPlugins } from '../core/plugins/load.js';
import { applyOnConfigHooks, runPluginHook } from '../application/plugins/hooks.js';

export interface BuildOptions {
  syncDb?: boolean;
  projectRoot?: string;
}

export async function runBuild(opts: BuildOptions = {}): Promise<void> {
  const projectRoot = resolve(opts.projectRoot ?? process.cwd());
  const configPath = join(projectRoot, 'config.yaml');

  if (!existsSync(configPath)) {
    console.error(`\x1b[31m✗ config.yaml을 찾을 수 없습니다: ${configPath}\x1b[0m`);
    process.exit(1);
  }

  // ── config.yaml 로드 & 검증 ──────────────────────────────────────────────
  const rawConfig = yaml.load(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  const configResult = SiteConfigSchema.safeParse(rawConfig);
  if (!configResult.success) {
    console.error('\x1b[31m✗ config.yaml 검증 실패:\x1b[0m');
    configResult.error.issues.forEach((i) =>
      console.error(`  - ${i.path.join('.')}: ${i.message}`),
    );
    process.exit(1);
  }
  const config = configResult.data;

  const plugins = await loadUserPlugins(projectRoot);
  const finalConfig = await applyOnConfigHooks(plugins, config, projectRoot);

  console.log(`\x1b[36m🔧 빌드 시작: ${finalConfig.site.title}\x1b[0m`);

  // ── 1단계: 마크다운 스캔 & 파싱 ────────────────────────────────────────
  console.log('  📄 마크다운 파싱 중...');
  const contentDir = join(projectRoot, 'content');
  const { posts, pages } = await scanContentDir(contentDir);
  console.log(`     ${posts.size}개 글` + (pages.size ? `, ${pages.size}개 고정 페이지` : '') + ` 파싱 완료`);

  await runPluginHook(plugins, 'afterScan', {
    config: finalConfig,
    projectRoot,
    outDir: join(projectRoot, finalConfig.build.output),
    posts,
    pages,
  });

  // ── 2단계: 백링크 계산 ────────────────────────────────────────────────
  console.log('  🔗 백링크 계산 중...');
  const backlinkMap = buildBacklinkMap(posts);
  let totalBacklinks = 0;
  backlinkMap.forEach((v) => (totalBacklinks += v.length));
  console.log(`     ${totalBacklinks}개 백링크 계산 완료`);

  // ── 3단계: 정적 페이지 생성 ───────────────────────────────────────────
  console.log('  🏗  정적 페이지 생성 중...');
  await build({ projectRoot, config: finalConfig, posts, pages, backlinkMap });

  await runPluginHook(plugins, 'afterGenerate', {
    config: finalConfig,
    projectRoot,
    outDir: join(projectRoot, finalConfig.build.output),
    posts,
    pages,
  });

  // ── 4단계: Supabase 동기화 (선택적) ───────────────────────────────────
  if (opts.syncDb !== false && finalConfig.database) {
    console.log('  ☁  Supabase 동기화 중...');
    try {
      await syncPosts(posts, finalConfig.database);
      await syncBacklinks(backlinkMap, finalConfig.database);
      await cleanupOrphanPosts([...posts.keys()], finalConfig.database);
    } catch (err) {
      console.warn(`\x1b[33m⚠  Supabase 동기화 실패: ${(err as Error).message}\x1b[0m`);
    }
  }

  console.log(`\n\x1b[32m✓ 빌드 완료! → ${finalConfig.build.output}/\x1b[0m`);
}
