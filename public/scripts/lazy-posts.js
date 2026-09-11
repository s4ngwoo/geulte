/**
 * 글터 (Geulte) — public/scripts/lazy-posts.js
 * 랜딩 페이지 글 목록 무한 스크롤 / 레이지 로딩 (IntersectionObserver)
 */
(function () {
  'use strict';

  function initLazyPosts() {
    const sentinel = document.getElementById('postsLazySentinel');
    const postList = document.getElementById('postList');
    if (!sentinel || !postList) return;

    const total = parseInt(sentinel.dataset.total || '0', 10);
    const initial = parseInt(sentinel.dataset.initial || '10', 10);
    const pageSize = parseInt(sentinel.dataset.pageSize || '10', 10);

    const indicator = document.getElementById('lazyLoadingIndicator');
    const loadMoreBtn = document.getElementById('lazyLoadMoreBtn');
    const endMessage = document.getElementById('lazyEndMessage');

    let currentIndex = initial;
    let isLoading = false;
    let allPostsCache = null;

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatDate(dateVal) {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    }

    function createPostCardElement(post) {
      const li = document.createElement('li');
      li.className = 'post-card post-card--lazy';

      let metaHtml = '<div class="post-card-meta">';
      if (post.category) {
        metaHtml += `<a href="/categories/${encodeURIComponent(post.category)}" class="post-category">${escapeHtml(post.category)}</a>`;
      }
      metaHtml += `<time datetime="${escapeHtml(post.date)}" class="post-date">${formatDate(post.date)}</time>`;
      if (post.type) {
        metaHtml += `<span class="post-type post-type--${escapeHtml(post.type)}">${escapeHtml(post.type)}</span>`;
      }
      metaHtml += '</div>';

      const titleHtml = `<h2 class="post-card-title"><a href="/posts/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>`;

      let excerptHtml = '';
      if (post.excerpt) {
        excerptHtml = `<p class="post-card-excerpt">${escapeHtml(post.excerpt)}</p>`;
      }

      let tagsHtml = '';
      if (Array.isArray(post.tags) && post.tags.length > 0) {
        tagsHtml = '<div class="post-tags">';
        post.tags.forEach((tag) => {
          tagsHtml += `<a href="/tags/${encodeURIComponent(tag)}" class="tag">#${escapeHtml(tag)}</a>`;
        });
        tagsHtml += '</div>';
      }

      let seriesHtml = '';
      if (post.series) {
        seriesHtml = `<div class="post-series-badge"><a href="/series/${encodeURIComponent(post.series)}">📚 ${escapeHtml(post.series)}</a></div>`;
      }

      li.innerHTML = `
        <article>
          ${metaHtml}
          ${titleHtml}
          ${excerptHtml}
          ${tagsHtml}
          ${seriesHtml}
        </article>
      `;
      return li;
    }

    async function fetchAllPosts() {
      if (allPostsCache) return allPostsCache;
      try {
        const res = await fetch('/_geulte/data/posts.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // 날짜 역순 정렬 보장
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        allPostsCache = data;
        return data;
      } catch (err) {
        console.error('[Geulte] Failed to load posts for lazy loading:', err);
        return null;
      }
    }

    let observer = null;

    async function loadNextBatch() {
      if (isLoading || currentIndex >= total) return;
      isLoading = true;

      if (indicator) indicator.style.display = 'flex';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';

      const posts = await fetchAllPosts();
      if (!posts) {
        isLoading = false;
        if (indicator) indicator.style.display = 'none';
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'inline-flex';
          loadMoreBtn.textContent = '불러오기 실패 (다시 시도)';
        }
        return;
      }

      const nextBatch = posts.slice(currentIndex, currentIndex + pageSize);

      // DOM에 카드 추가
      const fragment = document.createDocumentFragment();
      nextBatch.forEach((post) => {
        const card = createPostCardElement(post);
        fragment.appendChild(card);
      });
      postList.appendChild(fragment);

      currentIndex += nextBatch.length;
      isLoading = false;
      if (indicator) indicator.style.display = 'none';

      // 모두 로드되었는지 확인
      if (currentIndex >= total || currentIndex >= posts.length) {
        if (endMessage) endMessage.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      } else {
        // 아직 남았으면 수동 버튼 노출 대비
        if (loadMoreBtn && !window.IntersectionObserver) {
          loadMoreBtn.style.display = 'inline-flex';
        }
      }
    }

    // IntersectionObserver 지원 여부에 따른 처리
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            loadNextBatch();
          }
        },
        { rootMargin: '250px 0px', threshold: 0.01 }
      );
      observer.observe(sentinel);
    } else {
      // Observer 미지원 시 버튼 표시
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'inline-flex';
      }
    }

    loadMoreBtn?.addEventListener('click', () => {
      loadNextBatch();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyPosts);
  } else {
    initLazyPosts();
  }
})();
