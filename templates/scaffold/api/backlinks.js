/**
 * 글터 (Geulte) — /api/backlinks
 * 특정 slug를 타겟으로 하는 백링크 목록 반환
 */
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug parameter' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 백링크를 남긴 글들의 메타데이터 조회
    // backlinks.target_slug = requested_slug
    // join with posts to get title, tags, excerpt (content_html)
    const { data, error } = await supabase
      .from('backlinks')
      .select(`
        slug,
        posts!inner(title, date, tags, category, content_html)
      `)
      .eq('target_slug', slug)
      .eq('posts.draft', false)
      .order('posts(date)', { ascending: false });

    if (error) throw error;

    const backlinks = data.map(item => ({
      slug: item.slug,
      title: item.posts.title,
      date: item.posts.date,
      tags: item.posts.tags,
      category: item.posts.category,
      excerpt: extractExcerpt(item.posts.content_html)
    }));

    res.status(200).json({ backlinks });
  } catch (err) {
    console.error('Backlinks API error:', err);
    res.status(500).json({ error: err.message });
  }
}

function extractExcerpt(html) {
  if (!html) return '';
  // HTML 태그 제거 후 200자 추출
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 200 ? text.substring(0, 200) + '...' : text;
}
