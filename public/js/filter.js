/**
 * 글터 (Geulte) — filter.js
 * 조합 필터 클라이언트 스크립트
 *
 * - Supabase에서 taxonomy 옵션 목록 로드
 * - 체크박스 UI 동적 생성
 * - /api/filter 호출 → 결과 렌더링
 * - URL pushState 동기화
 * - 키보드 & 접근성 지원
 */
(function () {
  'use strict';

  const cfg = window.__GEULTE_FILTER__;
  if (!cfg || !cfg.supabaseUrl) return;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const filterPanel   = document.getElementById('filterPanel');
  const filterGroups  = document.getElementById('filterGroups');
  const filterBadge   = document.getElementById('filterBadge');
  const filterReset   = document.getElementById('filterResetBtn');
  const resultCount   = document.getElementById('filterResultCount');
  const postCount     = document.getElementById('postCount');
  const staticList    = document.getElementById('staticPostList');
  const filterResults = document.getElementById('filterResults');

  if (!filterPanel) return;

  // ── 상태 ──────────────────────────────────────────────────────────────────
  const state = {
    tags: new Set(),
    topics: new Set(),
    keywords: new Set(),
    category: '',
    series: '',
    page: 1,
    loading: false,
  };

  // ── 필터 옵션 데이터 (사이드바에서 전달된 데이터) ────────────────────────
  function buildGroupData() {
    const parse = (arr) => (arr || []).map(x => ({
      value: typeof x === 'string' ? x : x.name,
      count: typeof x === 'object' ? x.count : 1,
    })).sort((a, b) => b.count - a.count); // 내림차순 정렬

    return {
      categories: parse(cfg.allCategories),
      series: parse(cfg.allSeries), // 시리즈 추가
      tags: parse(cfg.allTags),
      topics: parse(cfg.allTopics),
      keywords: parse(cfg.allKeywords)
    };
  }

  // ── 체크박스 옵션 생성 ───────────────────────────────────────────────────
  function renderOptions(listId, items, key, isRadio) {
    const ul = document.getElementById(listId);
    if (!ul || !items.length) {
      ul?.closest('.filter-group')?.style.setProperty('display', 'none');
      return;
    }
    ul.innerHTML = items.map(item => {
      const id = `filter-${key}-${encodeURIComponent(item.value)}`;
      const type = isRadio ? 'radio' : 'checkbox';
      return `
        <li class="filter-option">
          <label class="filter-option-label" for="${id}">
            <input type="${type}" id="${id}"
              name="filter-${key}"
              value="${escHtml(item.value)}"
              class="filter-checkbox"
              data-key="${key}"
              aria-label="${escHtml(item.value)} (${item.count}개)">
            <span class="filter-option-text">${escHtml(item.value)}</span>
            <span class="filter-option-count">${item.count}</span>
          </label>
        </li>`;
    }).join('');
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── 토글 아코디언 (기존 코드 제거됨) ──────────────────────────────────────────

  // ── URL 파라미터 복원 ─────────────────────────────────────────────────────
  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.tags = new Set(params.getAll('tags'));
    state.topics = new Set(params.getAll('topics'));
    state.keywords = new Set(params.getAll('keywords'));
    state.category = params.get('category') ?? '';
    state.series = params.get('series') ?? '';
    state.page = parseInt(params.get('page') ?? '1', 10);
  }

  function syncCheckboxes() {
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
      const key = cb.dataset.key;
      const val = cb.value;
      if (key === 'tags') cb.checked = state.tags.has(val);
      else if (key === 'topics') cb.checked = state.topics.has(val);
      else if (key === 'keywords') cb.checked = state.keywords.has(val);
      else if (key === 'category') cb.checked = (state.category === val);
      else if (key === 'series') cb.checked = (state.series === val);
    });
    updateBadge();
  }

  function updateBadge() {
    const total = state.tags.size + state.topics.size + state.keywords.size + (state.category ? 1 : 0) + (state.series ? 1 : 0);
    filterBadge.textContent = total;
    filterBadge.style.display = total > 0 ? 'inline-flex' : 'none';
  }

  // ── 동적 카운트 및 비활성화(Faceted Search) ──────────────────────────────
  function getOriginalGroupData(key) {
    if (key === 'category') return cfg.allCategories || [];
    if (key === 'series') return cfg.allSeries || [];
    if (key === 'tags') return cfg.allTags || [];
    if (key === 'topics') return cfg.allTopics || [];
    if (key === 'keywords') return cfg.allKeywords || [];
    return [];
  }

  // 선택된 항목은 일반 정렬에서 제외하고 항상 최상단 고정, 나머지는 글 갯수 내림차순 정렬
  function sortFilterLists() {
    ['category', 'series', 'tags', 'topics', 'keywords'].forEach(key => {
      const listId = `filterGroup${key.charAt(0).toUpperCase() + key.slice(1)}List`;
      const ul = document.getElementById(listId);
      if (!ul) return;
      const lis = Array.from(ul.children);
      lis.sort((a, b) => {
        const cbA = a.querySelector('.filter-checkbox');
        const cbB = b.querySelector('.filter-checkbox');
        const checkedA = cbA ? cbA.checked : false;
        const checkedB = cbB ? cbB.checked : false;

        // 1. 선택된 항목은 일반 정렬에서 제외하고 항상 맨 위로 배치
        if (checkedA && !checkedB) return -1;
        if (!checkedA && checkedB) return 1;

        // 2. 둘 다 선택되었거나 둘 다 선택되지 않은 항목끼리는 글 갯수 내림차순 정렬
        const countA = parseInt(a.querySelector('.filter-option-count')?.textContent, 10) || 0;
        const countB = parseInt(b.querySelector('.filter-option-count')?.textContent, 10) || 0;
        if (countB !== countA) {
          return countB - countA;
        }

        // 3. 갯수가 같은 경우: 이름순(가나다/알파벳) 정렬
        const textA = a.querySelector('.filter-option-text')?.textContent || '';
        const textB = b.querySelector('.filter-option-text')?.textContent || '';
        return textA.localeCompare(textB, 'ko');
      });
      lis.forEach(li => ul.appendChild(li)); // DOM 재배치
    });
  }

  function updateFilterCounts(facets) {
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
      const key = cb.dataset.key; // 'category', 'series', 'tags', 'topics', 'keywords'
      const val = cb.value;
      const label = cb.closest('.filter-option-label');
      const countSpan = label.querySelector('.filter-option-count');

      const facetKey = key === 'category' ? 'categories' : key;
      let count = 0;
      let ignoreFacet = false;

      // UX Tweak: 카테고리/시리즈(단일 선택)가 선택된 상태에서는, 동일 그룹의 다른 옵션들의 카운트를 
      // 0으로 만들고 비활성화하면 사용자가 변경(라디오 동작)할 수 없습니다.
      if ((key === 'category' && state.category && state.category !== val) || 
          (key === 'series' && state.series && state.series !== val)) {
         ignoreFacet = true;
      }

      if (facets && facets[facetKey] && facets[facetKey][val] !== undefined && !ignoreFacet) {
        count = facets[facetKey][val];
      } else if (!facets || ignoreFacet) {
        const groupData = getOriginalGroupData(key);
        const item = groupData.find(i => (typeof i === 'string' ? i : i.name) === val);
        count = item ? (typeof item === 'object' ? item.count : 1) : 0;
      }

      countSpan.textContent = count;
      
      if (count === 0 && !cb.checked) {
        cb.disabled = true;
        label.classList.add('disabled');
      } else {
        cb.disabled = false;
        label.classList.remove('disabled');
      }
    });

    // 선택된 항목은 항상 맨 위로, 나머지는 글 갯수 내림차순 정렬
    sortFilterLists();
  }

  // ── URL 업데이트 ──────────────────────────────────────────────────────────
  function pushUrl() {
    const params = new URLSearchParams();
    state.tags.forEach(t => params.append('tags', t));
    state.topics.forEach(t => params.append('topics', t));
    state.keywords.forEach(t => params.append('keywords', t));
    if (state.category) params.set('category', state.category);
    if (state.series) params.set('series', state.series);
    if (state.page > 1) params.set('page', state.page);
    const qs = params.toString();
    history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  // ── 필터 API 호출 & 렌더 ─────────────────────────────────────────────────
  let fetchController = null;

  async function fetchAndRender() {
    if (state.loading) return;
    const hasFilter = state.tags.size > 0 || state.topics.size > 0 || state.keywords.size > 0 || state.category || state.series;

    if (!hasFilter) {
      // 필터 없으면 정적 목록 복원
      if (staticList) staticList.style.display = '';
      if (filterResults) filterResults.innerHTML = '';
      if (resultCount) resultCount.textContent = '';
      updateFilterCounts(null);
      return;
    }

    // 정적 목록 숨기기
    if (staticList) staticList.style.display = 'none';

    const params = new URLSearchParams();
    state.tags.forEach(t => params.append('tags', t));
    state.topics.forEach(t => params.append('topics', t));
    state.keywords.forEach(t => params.append('keywords', t));
    if (state.category) params.set('category', state.category);
    if (state.series) params.set('series', state.series);
    params.set('page', state.page);

    if (fetchController) fetchController.abort();
    fetchController = new AbortController();

    state.loading = true;
    if (filterResults) {
      filterResults.innerHTML = '<div class="filter-loading" aria-live="polite">검색 중…</div>';
    }

    try {
      const t0 = performance.now();
      const res = await fetch(`/api/filter?${params}`, { signal: fetchController.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const ms = Math.round(performance.now() - t0);

      renderFilterResults(data, ms);
      updateFilterCounts(data.facets);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (filterResults) {
        filterResults.innerHTML = `<p class="filter-error">오류: ${escHtml(err.message)}</p>`;
      }
    } finally {
      state.loading = false;
    }
  }

  function renderFilterResults(data, ms) {
    const { posts, total, page, pageSize, hasMore } = data;

    if (resultCount) {
      resultCount.textContent = `${total}개 결과 (${ms}ms)`;
    }
    if (postCount) postCount.textContent = `${total}개의 글`;

    if (!posts.length) {
      filterResults.innerHTML = '<p class="empty-state">조건에 맞는 글이 없습니다.</p>';
      return;
    }

    filterResults.innerHTML = `
      <ul class="post-list">
        ${posts.map(post => `
          <li class="post-card">
            <article>
              <div class="post-card-meta">
                ${post.category ? `<a href="/categories/${encodeURIComponent(post.category)}" class="post-category">${escHtml(post.category)}</a>` : ''}
                <time class="post-date">${formatDate(post.date)}</time>
                ${post.type ? `<span class="post-type post-type--${escHtml(post.type)}">${escHtml(post.type)}</span>` : ''}
              </div>
              <h2 class="post-card-title">
                <a href="/posts/${encodeURIComponent(post.slug)}">${escHtml(post.title)}</a>
              </h2>
              ${post.excerpt ? `<p class="post-card-excerpt">${escHtml(post.excerpt)}</p>` : ''}
              ${post.tags?.length ? `<div class="post-tags">${post.tags.map(t => `<a href="/tags/${encodeURIComponent(t)}" class="tag">#${escHtml(t)}</a>`).join('')}</div>` : ''}
              ${post.topics?.length ? `<div class="post-tags">${post.topics.map(t => `<a href="/topics/${encodeURIComponent(t)}" class="tag tag--topic">${escHtml(t)}</a>`).join('')}</div>` : ''}
              ${post.keywords?.length ? `<div class="post-tags">${post.keywords.map(k => `<a href="/keywords/${encodeURIComponent(k)}" class="tag tag--keyword">${escHtml(k)}</a>`).join('')}</div>` : ''}
            </article>
          </li>`).join('')}
      </ul>
      ${hasMore ? `<button class="filter-load-more" id="filterLoadMore" type="button">더 보기 (${total - page * pageSize}개 남음)</button>` : ''}`;

    document.getElementById('filterLoadMore')?.addEventListener('click', () => {
      state.page += 1;
      pushUrl();
      fetchAndAppend();
    });
  }

  async function fetchAndAppend() {
    const params = new URLSearchParams();
    state.tags.forEach(t => params.append('tags', t));
    state.topics.forEach(t => params.append('topics', t));
    state.keywords.forEach(t => params.append('keywords', t));
    if (state.category) params.set('category', state.category);
    if (state.series) params.set('series', state.series);
    params.set('page', state.page);

    const res = await fetch(`/api/filter?${params}`);
    const data = await res.json();
    const ul = filterResults.querySelector('.post-list');
    const btn = document.getElementById('filterLoadMore');

    data.posts.forEach(post => {
      const li = document.createElement('li');
      li.className = 'post-card';
      li.innerHTML = `<article>
        <div class="post-card-meta">
          ${post.category ? `<a href="/categories/${encodeURIComponent(post.category)}" class="post-category">${escHtml(post.category)}</a>` : ''}
          <time class="post-date">${formatDate(post.date)}</time>
        </div>
        <h2 class="post-card-title"><a href="/posts/${encodeURIComponent(post.slug)}">${escHtml(post.title)}</a></h2>
        ${post.excerpt ? `<p class="post-card-excerpt">${escHtml(post.excerpt)}</p>` : ''}
        ${post.tags?.length ? `<div class="post-tags">${post.tags.map(t => `<a href="/tags/${encodeURIComponent(t)}" class="tag">#${escHtml(t)}</a>`).join('')}</div>` : ''}
        ${post.topics?.length ? `<div class="post-tags">${post.topics.map(t => `<a href="/topics/${encodeURIComponent(t)}" class="tag tag--topic">${escHtml(t)}</a>`).join('')}</div>` : ''}
        ${post.keywords?.length ? `<div class="post-tags">${post.keywords.map(k => `<a href="/keywords/${encodeURIComponent(k)}" class="tag tag--keyword">${escHtml(k)}</a>`).join('')}</div>` : ''}
      </article>`;
      ul?.appendChild(li);
    });

    if (!data.hasMore) btn?.remove();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── 체크박스 이벤트 ───────────────────────────────────────────────────────
  let debounce = null;

  document.addEventListener('change', e => {
    const cb = e.target.closest('.filter-checkbox');
    if (!cb) return;

    const key = cb.dataset.key;
    const val = cb.value;

    if (key === 'tags') {
      if (cb.checked) state.tags.add(val);
      else state.tags.delete(val);
    } else if (key === 'topics') {
      if (cb.checked) state.topics.add(val);
      else state.topics.delete(val);
    } else if (key === 'keywords') {
      if (cb.checked) state.keywords.add(val);
      else state.keywords.delete(val);
    } else if (key === 'category') {
      state.category = cb.checked ? val : '';
      // 라디오 효과: 같은 그룹의 다른 체크박스 해제
      document.querySelectorAll('[data-key="category"]').forEach(other => {
        if (other !== cb) other.checked = false;
      });
    } else if (key === 'series') {
      state.series = cb.checked ? val : '';
      document.querySelectorAll('[data-key="series"]').forEach(other => {
        if (other !== cb) other.checked = false;
      });
    }

    if (cb.checked) {
      const parentUl = cb.closest('.filter-option-list');
      if (parentUl) parentUl.scrollTop = 0;
    }

    state.page = 1;
    updateBadge();
    clearTimeout(debounce);
    debounce = setTimeout(() => { pushUrl(); fetchAndRender(); }, 100);
  });

  // ── 초기화 버튼 ───────────────────────────────────────────────────────────
  filterReset?.addEventListener('click', () => {
    state.tags.clear();
    state.topics.clear();
    state.keywords.clear();
    state.category = '';
    state.series = '';
    state.page = 1;
    syncCheckboxes();
    pushUrl();
    fetchAndRender();
  });

  // ── popstate (뒤로 가기) ─────────────────────────────────────────────────
  window.addEventListener('popstate', () => {
    readUrl();
    syncCheckboxes();
    fetchAndRender();
  });

  // ── 초기화 ───────────────────────────────────────────────────────────────
  const { categories, series, tags, topics, keywords } = buildGroupData();
  renderOptions('filterGroupCategoryList', categories, 'category', true);
  renderOptions('filterGroupSeriesList', series, 'series', true);
  renderOptions('filterGroupTagsList', tags, 'tags', false);
  renderOptions('filterGroupTopicsList', topics, 'topics', false);
  renderOptions('filterGroupKeywordsList', keywords, 'keywords', false);

  readUrl();
  syncCheckboxes();
  sortFilterLists();

  // URL에 파라미터가 있으면 즉시 필터 실행
  const hasInitialFilter = state.tags.size > 0 || state.topics.size > 0 || state.keywords.size > 0 || state.category || state.series;
  if (hasInitialFilter) fetchAndRender();
})();
