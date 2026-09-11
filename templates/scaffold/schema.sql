-- ============================================================
-- 글터 (Geulte) — Supabase 데이터베이스 스키마
-- 테이블 생성 및 전문 검색(Full-text Search), GIN 인덱스 정의
-- ============================================================

-- 1. 포스트 테이블
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

-- 2. 백링크(역방향 링크) 테이블
CREATE TABLE IF NOT EXISTS backlinks (
  slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  PRIMARY KEY (slug, target_slug)
);

-- 3. 고성능 다중 분류 조회를 위한 GIN / B-Tree 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_tags      ON posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_posts_topics    ON posts USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_posts_keywords  ON posts USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_posts_category  ON posts (category, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search    ON posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_posts_views     ON posts (view_count DESC);

-- 4. 조회수 원자적 증가 함수 (RPC)
-- Supabase Dashboard > SQL Editor 에서 실행하거나 supabase/migrations 에 추가하세요.
CREATE OR REPLACE FUNCTION increment_view_count(post_slug TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = post_slug
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- 5. RPC 실행 권한 부여 (anon 역할에서 호출 가능하게)
GRANT EXECUTE ON FUNCTION increment_view_count(TEXT) TO anon, authenticated;
