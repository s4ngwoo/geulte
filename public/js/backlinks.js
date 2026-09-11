/**
 * 글터 (Geulte) — backlinks.js
 * 클라이언트 사이드 백링크 조회 및 팝오버 미리보기 기능
 */
(function () {
  'use strict';

  const cfg = window.__GEULTE_CONFIG__;
  if (!cfg || !cfg.slug) return;

  const backlinksContainer = document.getElementById('backlinksContainer');
  const backlinksList = document.getElementById('backlinksList');
  const backlinksLoading = document.getElementById('backlinksLoading');

  const relatedPostsSection = document.getElementById('relatedPostsSection');
  const relatedPostsList = document.getElementById('relatedPostsList');

  const popover = document.getElementById('linkPopover');
  const popoverTitle = document.getElementById('popoverTitle');
  const popoverMeta = document.getElementById('popoverMeta');
  const popoverExcerpt = document.getElementById('popoverExcerpt');
  const popoverLoading = document.getElementById('popoverLoading');
  const popoverData = document.getElementById('popoverData');

  let backlinkData = [];
  let popoverTimer = null;
  const POPOVER_DELAY = 300;

  async function init() {
    try {
      const res = await fetch(`/api/backlinks?slug=${encodeURIComponent(cfg.slug)}`);
      if (!res.ok) throw new Error('Failed to fetch backlinks');
      const data = await res.json();
      backlinkData = data.backlinks || [];

      renderBacklinks();
      renderRelatedPosts();
    } catch (err) {
      console.error('[Geulte] 백링크 조회 오류:', err);
      if (backlinksLoading) backlinksLoading.textContent = '백링크를 불러올 수 없습니다.';
    }
  }

  function renderBacklinks() {
    if (!backlinksContainer || !backlinksList || !backlinksLoading) return;

    if (backlinkData.length === 0) {
      backlinksLoading.textContent = '백링크 없음';
      return;
    }

    backlinksLoading.style.display = 'none';
    backlinksList.style.display = '';

    backlinksList.innerHTML = backlinkData.map(post => `
      <li class="backlink-item">
        <a href="/posts/${encodeURIComponent(post.slug)}" data-slug="${escHtml(post.slug)}">
          ${escHtml(post.title)}
        </a>
      </li>
    `).join('');

    // 팝오버 이벤트 연결
    const links = backlinksList.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
      link.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  function renderRelatedPosts() {
    if (!relatedPostsSection || !relatedPostsList) return;
    const related = window.__GEULTE_RELATED__ || [];
    if (related.length === 0) return;

    // 백링크에 있는 글은 제외
    const backlinkSlugs = new Set(backlinkData.map(b => b.slug));
    const filtered = related.filter(r => !backlinkSlugs.has(r.slug)).slice(0, 3);

    if (filtered.length === 0) return;

    relatedPostsList.innerHTML = filtered.map(r => `
      <li>
        <a href="/posts/${encodeURIComponent(r.slug)}" class="sidebar-link sidebar-link--post">
          ${escHtml(r.title)}
        </a>
      </li>
    `).join('');

    relatedPostsSection.style.display = '';
  }

  // ─── 팝오버 로직 ─────────────────────────────────────────────────────────

  function handleMouseEnter(e) {
    const link = e.target;
    const slug = link.dataset.slug;
    const post = backlinkData.find(b => b.slug === slug);
    if (!post) return;

    clearTimeout(popoverTimer);
    
    // 팝오버 위치 계산 (링크 오른쪽 아래 쯤)
    const rect = link.getBoundingClientRect();
    
    // 약간의 딜레이 후 표시
    popoverTimer = setTimeout(() => {
      showPopover(post, rect);
    }, POPOVER_DELAY);
  }

  function handleMouseLeave(e) {
    clearTimeout(popoverTimer);
    popoverTimer = setTimeout(() => {
      hidePopover();
    }, 100); // 팝오버 안으로 마우스가 들어갈 수 있는 유예 시간
  }

  if (popover) {
    popover.addEventListener('mouseenter', () => clearTimeout(popoverTimer));
    popover.addEventListener('mouseleave', () => hidePopover());
  }

  function showPopover(post, rect) {
    if (!popover) return;

    // 데이터 채우기
    popoverTitle.textContent = post.title;
    const dateStr = post.date ? new Date(post.date).toLocaleDateString() : '';
    const tagsStr = (post.tags || []).map(t => `#${t}`).join(' ');
    popoverMeta.textContent = `${dateStr} ${tagsStr}`.trim();
    popoverExcerpt.textContent = post.excerpt || '내용이 없습니다.';

    popoverLoading.style.display = 'none';
    popoverData.style.display = 'block';

    // 위치 설정
    // 스크롤 위치 고려
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    let top = rect.bottom + scrollTop + 10;
    let left = rect.left + scrollLeft;

    // 화면 오른쪽을 벗어나면 왼쪽으로 정렬
    if (left + 300 > window.innerWidth) {
      left = window.innerWidth - 320;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.classList.add('visible');
  }

  function hidePopover() {
    if (!popover) return;
    popover.classList.remove('visible');
  }

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init();
})();
