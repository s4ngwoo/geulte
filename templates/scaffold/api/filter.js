/**
 * /api/filter.js — Vercel 서버리스 함수
 * Supabase에서 다중 taxonomy 조합 필터링
 *
 * Query params:
 *   tags=AI&tags=LLM          (배열 → @> 조건)
 *   topics=온톨로지
 *   keywords=RAG
 *   category=기술
 *   page=1 (기본값 1, 페이지당 20개)
 */

import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase 환경변수가 설정되지 않았습니다' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 쿼리 파라미터 파싱 (다중 값 배열 지원)
  const url = new URL(req.url, `https://${req.headers.host}`);
  const tags = url.searchParams.getAll('tags').filter(Boolean);
  const topics = url.searchParams.getAll('topics').filter(Boolean);
  const keywords = url.searchParams.getAll('keywords').filter(Boolean);
  const category = url.searchParams.get('category') ?? null;
  const series = url.searchParams.get('series') ?? null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  try {
    let query = supabase
      .from('posts')
      .select('slug, title, date, updated, tags, topics, keywords, category, type, series, excerpt', {
        count: 'exact',
      })
      .eq('draft', false)
      .order('date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    // 배열 컬럼 @> 조건 (포함)
    if (tags.length > 0) query = query.contains('tags', tags);
    if (topics.length > 0) query = query.contains('topics', topics);
    if (keywords.length > 0) query = query.contains('keywords', keywords);
    if (category) query = query.eq('category', category);
    if (series) query = query.eq('series', series);

    // 전체 일치하는 항목에서 카테고리/태그/토픽/키워드 추출하여 동적 카운트 집계
    // 단, Supabase에서 직접 Group By가 어려우므로 해당 컬럼들만 가져옵니다.
    // 수천 개의 포스트가 될 수 있으므로 실제 서비스시엔 RPC를 고려해야 하지만 
    // 여기선 일단 select()로 전부 가져와 JS 단에서 처리합니다.
    let facetQuery = supabase
      .from('posts')
      .select('category, series, tags, topics, keywords')
      .eq('draft', false);
      
    if (tags.length > 0) facetQuery = facetQuery.contains('tags', tags);
    if (topics.length > 0) facetQuery = facetQuery.contains('topics', topics);
    if (keywords.length > 0) facetQuery = facetQuery.contains('keywords', keywords);
    if (category) facetQuery = facetQuery.eq('category', category);
    if (series) facetQuery = facetQuery.eq('series', series);

    const [pageRes, facetRes] = await Promise.all([query, facetQuery]);

    if (pageRes.error) throw pageRes.error;
    if (facetRes.error) throw facetRes.error;

    // 패싯(Facet) 집계 계산
    const facets = {
      categories: {},
      series: {},
      tags: {},
      topics: {},
      keywords: {}
    };

    (facetRes.data ?? []).forEach(p => {
      if (p.category) {
        facets.categories[p.category] = (facets.categories[p.category] || 0) + 1;
      }
      if (p.series) {
        facets.series[p.series] = (facets.series[p.series] || 0) + 1;
      }
      (p.tags || []).forEach(t => facets.tags[t] = (facets.tags[t] || 0) + 1);
      (p.topics || []).forEach(t => facets.topics[t] = (facets.topics[t] || 0) + 1);
      (p.keywords || []).forEach(t => facets.keywords[t] = (facets.keywords[t] || 0) + 1);
    });

    return res.status(200).json({
      posts: pageRes.data ?? [],
      total: pageRes.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      hasMore: offset + PAGE_SIZE < (pageRes.count ?? 0),
      facets
    });
  } catch (err) {
    console.error('[/api/filter]', err);
    return res.status(500).json({ error: err.message });
  }
}
