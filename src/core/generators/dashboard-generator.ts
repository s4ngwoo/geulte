import type { PostMeta, SiteConfig } from '../../types.js';
import { writePage } from './page-writer.js';
import {
  countDashboardStats,
  shouldGenerateDashboard,
} from '../../application/dashboard/stats.js';

export interface DashboardGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
}

/**
 * /dashboard — 블로그 통계 대시보드 페이지 생성
 * Supabase가 설정된 경우에만 생성.
 */
export function generateDashboard(opts: DashboardGeneratorOptions): void {
  const { outDir, config, postMetas } = opts;

  if (!shouldGenerateDashboard(config)) {
    return;
  }

  const siteTitle = config.site.title;
  const supabaseUrl = config.database!.url.startsWith('env:')
    ? ''
    : config.database!.url;
  const supabaseKey = config.database!.key.startsWith('env:')
    ? ''
    : config.database!.key;

  const stats = countDashboardStats(postMetas);

  const html = buildDashboardHtml({
    siteTitle,
    supabaseUrl,
    supabaseKey,
    ...stats,
  });

  writePage(outDir, '/dashboard', html);
  console.log(`\x1b[32m✓ 대시보드 생성: /dashboard\x1b[0m`);
}

interface DashboardData {
  siteTitle: string;
  supabaseUrl: string;
  supabaseKey: string;
  totalPosts: number;
  categoryCount: number;
  tagCount: number;
  seriesCount: number;
}

function buildDashboardHtml(data: DashboardData): string {
  const {
    siteTitle, supabaseUrl, supabaseKey,
    totalPosts, categoryCount, tagCount, seriesCount,
  } = data;

  return /* html */`<!DOCTYPE html>
<html lang="ko" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>대시보드 — ${siteTitle}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="/_geulte/css/style.css">
  <style>
    /* ── 대시보드 전용 스타일 ─────────────────────────────────── */
    .dash-root {
      min-height: 100vh;
      background: var(--color-bg);
      padding: var(--space-8) var(--space-6);
      max-width: 900px;
      margin: 0 auto;
    }
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }
    .dash-title {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--color-text);
    }
    .dash-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }
    .dash-home-link {
      font-size: var(--font-size-sm);
      color: var(--color-accent);
    }

    /* 요약 카드 */
    .dash-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }
    .dash-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      text-align: center;
    }
    .dash-card-value {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      color: var(--color-accent);
      font-variant-numeric: tabular-nums;
    }
    .dash-card-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }

    /* 인기 글 테이블 */
    .dash-section-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .dash-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }
    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }
    .dash-table th {
      background: var(--color-bg-tertiary);
      color: var(--color-text-muted);
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    .dash-table td {
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-border);
      color: var(--color-text);
    }
    .dash-table tr:hover td { background: var(--color-bg-secondary); }
    .dash-table td a { color: var(--color-accent); }
    .dash-num {
      font-variant-numeric: tabular-nums;
      color: var(--color-text-muted);
      text-align: right;
    }
    .dash-loading {
      text-align: center;
      color: var(--color-text-muted);
      padding: var(--space-8);
    }
    .dash-error {
      text-align: center;
      color: #f85149;
      padding: var(--space-8);
    }

    /* 최근 활동 */
    .dash-section { margin-bottom: var(--space-8); }
  </style>
</head>
<body>
<div class="dash-root">
  <header class="dash-header">
    <div>
      <h1 class="dash-title">📊 대시보드</h1>
      <p class="dash-subtitle">${siteTitle}</p>
    </div>
    <a href="/" class="dash-home-link">← 블로그로</a>
  </header>

  <!-- 요약 카드 -->
  <div class="dash-summary">
    <div class="dash-card">
      <div class="dash-card-value">${totalPosts}</div>
      <div class="dash-card-label">발행된 글</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-value" id="dashTotalViews">—</div>
      <div class="dash-card-label">총 조회수</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-value">${categoryCount}</div>
      <div class="dash-card-label">카테고리</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-value">${tagCount}</div>
      <div class="dash-card-label">태그</div>
    </div>
    <div class="dash-card">
      <div class="dash-card-value">${seriesCount}</div>
      <div class="dash-card-label">시리즈</div>
    </div>
  </div>

  <!-- 인기 글 (조회수 TOP 20) -->
  <section class="dash-section">
    <h2 class="dash-section-title">🔥 인기 글 (조회수 TOP 20)</h2>
    <div class="dash-table-wrap">
      <div id="dashTopPosts" class="dash-loading">불러오는 중...</div>
    </div>
  </section>

  <!-- 최근 글 -->
  <section class="dash-section">
    <h2 class="dash-section-title">🕐 최근 발행된 글</h2>
    <div class="dash-table-wrap">
      <div id="dashRecentPosts" class="dash-loading">불러오는 중...</div>
    </div>
  </section>
</div>

<script>
(function () {
  'use strict';
  var supabaseUrl = ${JSON.stringify(supabaseUrl)};
  var supabaseKey = ${JSON.stringify(supabaseKey)};

  // 환경 변수 기반인 경우 API를 통해 가져옴
  if (!supabaseUrl || !supabaseKey) {
    // 환경변수 방식 — 서버사이드 처리 불가
    document.getElementById('dashTopPosts').innerHTML =
      '<div class="dash-error">Supabase URL/KEY가 대시보드에 내장되지 않았습니다.<br>환경 변수 방식은 서버사이드가 필요합니다.</div>';
    document.getElementById('dashRecentPosts').innerHTML = '';
    return;
  }

  // 직접 Supabase REST API 호출
  var headers = {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json',
  };

  function fmt(n) {
    return typeof n === 'number' ? n.toLocaleString('ko-KR') : '0';
  }

  function buildTable(posts, fields) {
    if (!posts || posts.length === 0) {
      return '<div class="dash-loading">데이터 없음</div>';
    }
    var rows = posts.map(function (p, i) {
      return '<tr>' +
        '<td class="dash-num">' + (i + 1) + '</td>' +
        '<td><a href="/posts/' + p.slug + '" target="_blank">' + (p.title || p.slug) + '</a></td>' +
        '<td>' + (p.category || '—') + '</td>' +
        '<td class="dash-num">' + fmt(p.view_count) + '</td>' +
        '<td class="dash-num">' + (p.date ? p.date.slice(0,10) : '—') + '</td>' +
        '</tr>';
    }).join('');
    return '<table class="dash-table"><thead><tr>' +
      '<th>#</th><th>제목</th><th>카테고리</th><th style="text-align:right">조회수</th><th style="text-align:right">날짜</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // 인기글 (view_count DESC)
  fetch(supabaseUrl + '/rest/v1/posts?select=slug,title,category,date,view_count&draft=eq.false&order=view_count.desc&limit=20', {
    headers: headers
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    var total = Array.isArray(data) ? data.reduce(function (s, p) { return s + (p.view_count || 0); }, 0) : 0;
    document.getElementById('dashTotalViews').textContent = fmt(total);
    document.getElementById('dashTopPosts').outerHTML =
      '<div id="dashTopPosts">' + buildTable(Array.isArray(data) ? data : []) + '</div>';
  })
  .catch(function (e) {
    document.getElementById('dashTopPosts').innerHTML = '<div class="dash-error">오류: ' + e.message + '</div>';
  });

  // 최근글 (date DESC)
  fetch(supabaseUrl + '/rest/v1/posts?select=slug,title,category,date,view_count&draft=eq.false&order=date.desc&limit=20', {
    headers: headers
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    document.getElementById('dashRecentPosts').outerHTML =
      '<div id="dashRecentPosts">' + buildTable(Array.isArray(data) ? data : []) + '</div>';
  })
  .catch(function (e) {
    document.getElementById('dashRecentPosts').innerHTML = '<div class="dash-error">오류: ' + e.message + '</div>';
  });
})();
</script>
</body>
</html>`;
}
