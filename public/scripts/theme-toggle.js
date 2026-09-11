/**
 * 글터 (Geulte) — public/scripts/theme-toggle.js
 * 다크모드 / 라이트모드 토글 및 로컬 스토리지 영속화, 시스템 테마(prefers-color-scheme) 동기화
 */
(function () {
  'use strict';

  const THEME_KEY = 'geulte-theme';
  const htmlEl = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme, save = true) {
    htmlEl.setAttribute('data-theme', theme);
    if (save) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        // Private browsing mode fallback
      }
    }

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      const isDark = theme === 'dark';
      toggleBtn.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
      toggleBtn.setAttribute('title', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
    }
  }

  function initTheme() {
    let currentTheme = null;
    try {
      currentTheme = localStorage.getItem(THEME_KEY);
    } catch (e) {
      // Storage unavailable
    }

    if (currentTheme === 'light' || currentTheme === 'dark') {
      applyTheme(currentTheme, false);
    } else {
      // 로컬 저장이 없으면 data-theme 서버 렌더링 값 또는 시스템 설정 우선
      const serverTheme = htmlEl.getAttribute('data-theme');
      const initial = serverTheme || getSystemTheme();
      applyTheme(initial, false);
    }

    // 시스템 테마 변경 실시간 감지 (사용자가 수동 고정하지 않은 경우)
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        let stored = null;
        try {
          stored = localStorage.getItem(THEME_KEY);
        } catch (err) {}
        if (!stored) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
    }
  }

  function setupToggleListener() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  // 즉시 실행 (FOUC 방지)
  initTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggleListener);
  } else {
    setupToggleListener();
  }
})();
