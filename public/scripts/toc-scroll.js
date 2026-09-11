/**
 * 글터 (Geulte) — public/scripts/toc-scroll.js
 * 목차(TOC) 스무스 스크롤 및 뷰포트 위치 연동 하이라이트 (Scrollspy)
 */
(function () {
  'use strict';

  function initTocScroll() {
    const tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks || tocLinks.length === 0) return;

    // 본문 내 ID를 가진 제목 요소들 수집 (h2, h3, h4)
    const headings = Array.from(
      document.querySelectorAll('.post-body h2[id], .post-body h3[id], .post-body h4[id]')
    );

    if (headings.length === 0) return;

    const mobileSummaryTitle = document.getElementById('mobileTocCurrentTitle');

    // ─── 1. TOC 링크 클릭 시 부드러운 스크롤 ───────────────────────
    tocLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const targetId = decodeURIComponent(href.slice(1));
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', '#' + encodeURIComponent(targetId));

          setActiveToc(targetId);

          // 모바일 스티키 목차 드롭다운이 열려있다면 닫기
          const stickyDetails = link.closest('.mobile-sticky-toc-details');
          if (stickyDetails) {
            stickyDetails.open = false;
          }
        }
      });
    });

    // ─── 2. 활성 목차 하이라이트 반영 함수 ─────────────────────────
    let currentActiveId = null;

    function setActiveToc(id) {
      if (!id || id === currentActiveId) return;
      currentActiveId = id;

      let activeText = '';

      tocLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const linkId = href ? decodeURIComponent(href.slice(1)) : '';
        const isActive = linkId === id;
        link.classList.toggle('active', isActive);

        // 부모 li에도 active 상태 반영
        const parentLi = link.closest('.toc-item');
        if (parentLi) {
          parentLi.classList.toggle('active', isActive);
        }

        if (isActive) {
          activeText = link.textContent.trim();
        }
      });

      // 모바일 스티키 TOC 바 요약 텍스트 업데이트
      if (mobileSummaryTitle && activeText) {
        mobileSummaryTitle.textContent = activeText;
      }

      // 우측 사이드바 내 목차 리스트 스크롤 보정
      try {
        const activeLink = document.querySelector(`.sidebar-right .toc-link[href="#${CSS.escape(id)}"]`);
        if (activeLink) {
          const sidebarRight = document.querySelector('.sidebar-right');
          if (sidebarRight) {
            const linkRect = activeLink.getBoundingClientRect();
            const sidebarRect = sidebarRight.getBoundingClientRect();
            if (linkRect.top < sidebarRect.top + 60 || linkRect.bottom > sidebarRect.bottom - 40) {
              activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }
      } catch {
        // CSS.escape 불가 등 예외 무시
      }
    }

    // ─── 3. IntersectionObserver + 스크롤 정밀 위치 감지 ──────────
    const HEADER_OFFSET = 110; // sticky header(60px) + mobile toc bar / padding(50px)

    function updateActiveHeading() {
      // 뷰포트 상단에 가장 가까운 헤더 감지
      let activeHeading = null;

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const rect = heading.getBoundingClientRect();

        if (rect.top <= HEADER_OFFSET + 10) {
          activeHeading = heading;
        } else {
          break;
        }
      }

      // 아직 첫 헤더 위쪽이면 첫 헤더 선택
      if (!activeHeading && headings.length > 0) {
        const firstRect = headings[0].getBoundingClientRect();
        if (firstRect.top < window.innerHeight * 0.6) {
          activeHeading = headings[0];
        }
      }

      if (activeHeading) {
        setActiveToc(activeHeading.id);
      }
    }

    // IntersectionObserver로 스크롤 시 효율적 감지
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    }

    // Observer 등록 (헤더 진입/이탈 감지)
    const observer = new IntersectionObserver(
      () => {
        updateActiveHeading();
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -65% 0px`,
        threshold: [0, 1.0],
      }
    );

    headings.forEach((h) => observer.observe(h));
    window.addEventListener('scroll', onScroll, { passive: true });

    // 초기 진입 시 위치 하이라이트
    updateActiveHeading();
  }

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTocScroll);
  } else {
    initTocScroll();
  }
})();
