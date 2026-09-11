/**
 * /api/track-view.js — Vercel 서버리스 함수
 * 글 조회수 증가 (Supabase RPC: increment_view_count)
 *
 * POST /api/track-view
 * Body: { slug: "my-post-slug" }
 *
 * 응답: { ok: true, view_count: 42 }
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase 환경변수가 설정되지 않았습니다' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const slug = body?.slug;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'slug 파라미터가 필요합니다' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // view_count 원자적 증가
  const { data, error } = await supabase.rpc('increment_view_count', { post_slug: slug });
  if (error) {
    // RPC가 없으면 fallback: 직접 update
    const { data: row, error: fetchErr } = await supabase
      .from('posts')
      .select('view_count')
      .eq('slug', slug)
      .single();

    if (fetchErr) return res.status(404).json({ error: '글을 찾을 수 없습니다' });

    const newCount = (row?.view_count ?? 0) + 1;
    const { error: updateErr } = await supabase
      .from('posts')
      .update({ view_count: newCount })
      .eq('slug', slug);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({ ok: true, view_count: newCount });
  }

  return res.status(200).json({ ok: true, view_count: data });
}
