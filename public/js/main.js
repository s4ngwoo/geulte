/**
 * 글터 (Geulte) — main.js
 * 모바일 사이드바 드로어, 최신글/인기글 탭 전환, 태그 클라우드 더보기 토글, 사이드바 섹션 접기 상태 유지
 */
(function () {
  'use strict';

  // ─── 모바일 사이드바 드로어 ────────────────────────────────────
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebarLeft');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
    hamburger?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.contains('open');
    isOpen ? closeSidebar() : openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  // ESC 키로 드로어 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ─── 사이드바 섹션 접기/펼치기 상태 유지 (localStorage) ───────────
  const collapsibleSections = document.querySelectorAll('.sidebar-collapse');
  collapsibleSections.forEach((section) => {
    const id = section.id;
    if (!id) return;
    const storageKey = `geulte_collapse_${id}`;

    // 저장된 상태 복원
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState !== null) {
        section.open = savedState === 'open';
      }
    } catch {
      // localStorage 불가 환경 예외 처리
    }

    // 상태 변경 감지
    section.addEventListener('toggle', () => {
      try {
        localStorage.setItem(storageKey, section.open ? 'open' : 'closed');
      } catch {
        // 무시
      }
    });
  });

  // ─── 최신글 / 인기글 탭 스위처 ────────────────────────────────
  const tabRecent = document.getElementById('tabRecent');
  const tabPopular = document.getElementById('tabPopular');
  const panelRecent = document.getElementById('widgetRecentPosts');
  const panelPopular = document.getElementById('widgetPopularPosts');

  function switchTab(target) {
    if (target === 'recent') {
      tabRecent?.classList.add('active');
      tabRecent?.setAttribute('aria-selected', 'true');
      tabPopular?.classList.remove('active');
      tabPopular?.setAttribute('aria-selected', 'false');
      if (panelRecent) panelRecent.hidden = false;
      if (panelPopular) panelPopular.hidden = true;
    } else {
      tabPopular?.classList.add('active');
      tabPopular?.setAttribute('aria-selected', 'true');
      tabRecent?.classList.remove('active');
      tabRecent?.setAttribute('aria-selected', 'false');
      if (panelRecent) panelRecent.hidden = true;
      if (panelPopular) panelPopular.hidden = false;
    }
  }

  tabRecent?.addEventListener('click', () => switchTab('recent'));
  tabPopular?.addEventListener('click', () => switchTab('popular'));

  // ─── 태그 클라우드 더 보기 토글 ─────────────────────────────
  const tagToggleBtn = document.getElementById('tagCloudToggleBtn');
  const tagCloudList = document.getElementById('tagCloudList');

  tagToggleBtn?.addEventListener('click', () => {
    const isExpanded = tagCloudList?.classList.toggle('is-expanded');
    tagToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    const textSpan = tagToggleBtn.querySelector('.toggle-text');
    const arrowSpan = tagToggleBtn.querySelector('.toggle-arrow');
    if (isExpanded) {
      if (textSpan) textSpan.textContent = '접기';
      if (arrowSpan) arrowSpan.textContent = '▴';
    } else {
      const overflowCount = tagCloudList?.querySelectorAll('.is-overflow-tag').length ?? 0;
      if (textSpan) textSpan.textContent = `더 보기 (${overflowCount}개)`;
      if (arrowSpan) arrowSpan.textContent = '▾';
    }
  });
})();
