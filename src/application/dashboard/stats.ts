import type { PostMeta } from '../../types.js';

/** 대시보드 상단 통계 — I/O 없는 집계. */
export function countDashboardStats(postMetas: PostMeta[]): {
  totalPosts: number;
  categoryCount: number;
  tagCount: number;
  seriesCount: number;
} {
  const published = postMetas.filter((p) => !p.draft);
  return {
    totalPosts: published.length,
    categoryCount: [...new Set(postMetas.map((p) => p.category).filter(Boolean))].length,
    tagCount: [...new Set(postMetas.flatMap((p) => p.tags))].length,
    seriesCount: [...new Set(postMetas.map((p) => p.series).filter(Boolean))].length,
  };
}

/** Supabase(database) 설정이 있을 때만 대시보드 페이지를 만든다. */
export function shouldGenerateDashboard(config: { database?: { url?: string } }): boolean {
  return Boolean(config.database?.url);
}
