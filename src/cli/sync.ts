import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import { scanContentDir } from '../core/parser.js';
import { buildBacklinkMap } from '../core/backlinks.js';
import { syncPosts, syncBacklinks, cleanupOrphanPosts } from '../core/supabase.js';
import { SiteConfigSchema } from '../schema.js';

export async function runSync(projectRoot_?: string): Promise<void> {
  const projectRoot = resolve(projectRoot_ ?? process.cwd());
  const configPath = join(projectRoot, 'config.yaml');

  if (!existsSync(configPath)) {
    console.error('\x1b[31m✗ config.yaml을 찾을 수 없습니다\x1b[0m');
    process.exit(1);
  }

  const rawConfig = yaml.load(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  const configResult = SiteConfigSchema.safeParse(rawConfig);
  if (!configResult.success) {
    console.error('\x1b[31m✗ config.yaml 검증 실패\x1b[0m');
    process.exit(1);
  }
  const config = configResult.data;

  if (!config.database) {
    console.warn('\x1b[33m⚠  database 설정이 없습니다. config.yaml에 database 섹션을 추가하세요.\x1b[0m');
    return;
  }

  console.log('\x1b[36m☁  Supabase 동기화 시작...\x1b[0m');

  const { posts } = await scanContentDir(join(projectRoot, 'content'));
  const backlinkMap = buildBacklinkMap(posts);

  await syncPosts(posts, config.database);
  await syncBacklinks(backlinkMap, config.database);
  await cleanupOrphanPosts([...posts.keys()], config.database);

  console.log('\x1b[32m✓ 동기화 완료\x1b[0m');
}
