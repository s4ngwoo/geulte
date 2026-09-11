import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Post, PostMeta } from '../types.js';
import { serializeBacklinks } from './backlinks.js';
import type { BacklinkMap } from '../types.js';

// ─── 클라이언트 팩토리 ────────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

function getClient(url: string, key: string): SupabaseClient {
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

function resolveEnvValue(value: string): string {
  if (value.startsWith('env:')) {
    return process.env[value.slice(4)] ?? '';
  }
  return value;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

// ─── DDL (테이블 생성 SQL) ────────────────────────────────────────────────────

export const SCHEMA_SQL = /* sql */ `
-- 글 테이블
CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  updated TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  category TEXT,
  type TEXT,
  series TEXT,
  content_html TEXT,
  draft BOOLEAN DEFAULT false,
  excerpt TEXT,
  view_count BIGINT DEFAULT 0,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) STORED
);

-- 백링크 테이블
CREATE TABLE IF NOT EXISTS backlinks (
  slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  PRIMARY KEY (slug, target_slug)
);

-- GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_tags      ON posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_posts_topics    ON posts USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_posts_keywords  ON posts USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_posts_category  ON posts (category, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search    ON posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_posts_views     ON posts (view_count DESC);
`;

// ─── 동기화 함수 ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

async function upsertBatched<T extends object>(
  client: SupabaseClient,
  table: string,
  rows: T[],
) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await client.from(table).upsert(batch, { onConflict: 'slug' });
    if (error) throw new Error(`Supabase upsert [${table}] 실패: ${error.message}`);
  }
}

/**
 * 모든 글을 Supabase `posts` 테이블에 upsert한다.
 * draft 글은 제외.
 */
export async function syncPosts(
  posts: Map<string, Post>,
  cfg: SupabaseConfig,
): Promise<void> {
  const url = resolveEnvValue(cfg.url);
  const key = resolveEnvValue(cfg.key);
  if (!url || !key) {
    console.warn('\x1b[33m⚠  SUPABASE_URL / SUPABASE_KEY 없음 — sync 건너뜀\x1b[0m');
    return;
  }

  const client = getClient(url, key);

  const rows = [...posts.values()].map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date.toISOString(),
    updated: p.updated?.toISOString() ?? null,
    tags: p.tags,
    topics: p.topics,
    keywords: p.keywords,
    category: p.category ?? null,
    type: p.type ?? null,
    series: p.series ?? null,
    content_html: p.contentHtml,
    draft: p.draft,
    excerpt: p.excerpt ?? null,
  }));

  await upsertBatched(client, 'posts', rows);
  console.log(`\x1b[36m↑ Supabase: ${rows.length}개 글 동기화 완료\x1b[0m`);
}

/**
 * 백링크를 Supabase `backlinks` 테이블에 upsert한다.
 * 먼저 기존 행을 모두 삭제하고 새로 삽입한다 (전체 재계산이므로).
 */
export async function syncBacklinks(
  backlinkMap: BacklinkMap,
  cfg: SupabaseConfig,
): Promise<void> {
  const url = resolveEnvValue(cfg.url);
  const key = resolveEnvValue(cfg.key);
  if (!url || !key) return;

  const client = getClient(url, key);
  const rows = serializeBacklinks(backlinkMap);

  // 전체 삭제 후 재삽입 (백링크는 빌드 시 전체 재계산)
  const { error: delError } = await client.from('backlinks').delete().neq('slug', '');
  if (delError) throw new Error(`backlinks 삭제 실패: ${delError.message}`);

  if (rows.length === 0) return;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await client.from('backlinks').insert(batch);
    if (error) throw new Error(`backlinks 삽입 실패: ${error.message}`);
  }

  console.log(`\x1b[36m↑ Supabase: ${rows.length}개 백링크 동기화 완료\x1b[0m`);
}

/**
 * 빌드 결과에 없는 slug를 DB에서 삭제한다 (글 삭제 시 orphan 정리).
 */
export async function cleanupOrphanPosts(
  activeSlugs: string[],
  cfg: SupabaseConfig,
): Promise<void> {
  const url = resolveEnvValue(cfg.url);
  const key = resolveEnvValue(cfg.key);
  if (!url || !key) return;

  const client = getClient(url, key);

  const { data, error } = await client.from('posts').select('slug');
  if (error) throw new Error(`posts 조회 실패: ${error.message}`);

  const dbSlugs = (data ?? []).map((r: { slug: string }) => r.slug);
  const toDelete = dbSlugs.filter((s: string) => !activeSlugs.includes(s));

  if (toDelete.length === 0) return;

  const { error: delError } = await client.from('posts').delete().in('slug', toDelete);
  if (delError) throw new Error(`orphan posts 삭제 실패: ${delError.message}`);

  console.log(`\x1b[36m↑ Supabase: ${toDelete.length}개 삭제된 글 정리 완료\x1b[0m`);
}
