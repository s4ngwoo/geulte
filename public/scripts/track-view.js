/**
 * track-view.js — 클라이언트 사이드 조회수 추적
 * post.njk 에서 로드. 같은 세션 내 중복 호출 방지.
 */
(function () {
  'use strict';

  const slug = document.body.dataset.postSlug;
  if (!slug) return;

  // 세션 내 중복 방지 (새로고침은 카운트)
  const sessionKey = 'geulte-viewed-' + slug;
  if (sessionStorage.getItem(sessionKey)) return;

  // 봇 여부 간단 체크 (headless 브라우저 방어)
  if (navigator.webdriver) return;

  // 1초 후 전송 (페이지가 실제로 로드됐는지 확인)
  setTimeout(function () {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug }),
      keepalive: true,
    })
      .then(function (res) {
        if (res.ok) {
          sessionStorage.setItem(sessionKey, '1');
          return res.json();
        }
      })
      .then(function (data) {
        // 뷰 카운트 UI 업데이트 (있을 경우)
        if (data && typeof data.view_count === 'number') {
          var el = document.getElementById('postViewCount');
          if (el) el.textContent = data.view_count.toLocaleString('ko-KR');
        }
      })
      .catch(function () {
        // 조용히 실패 — UX에 영향 없음
      });
  }, 1000);
})();
