/**
 * 글터 (Geulte) — search.js
 * 클라이언트 사이드 검색 (MiniSearch)
 */
(function () {
  'use strict';

  let miniSearch = null;
  let docs = null;

  const input = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('searchResults');
  if (!input || !resultsDiv) return;

  // 인덱스 지연 로딩
  async function loadIndex() {
    if (miniSearch) return;
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) throw new Error('Failed to load index');
      const data = await res.json();
      
      // MiniSearch.loadJSON(data) doesn't have MiniSearch in scope directly if loaded via script src.
      // Wait, we need to load minisearch library first. We will assume it's loaded via CDN in layout or we bundle it.
      // Actually we dumped the MiniSearch.toJSON() output in search-index.json.
      if (typeof MiniSearch === 'undefined') {
        throw new Error('MiniSearch library not loaded');
      }

      miniSearch = MiniSearch.loadJSON(JSON.stringify(data), {
        fields: ['title', 'excerpt', 'tags', 'category'],
        storeFields: ['title', 'slug', 'excerpt', 'date', 'tags', 'category'],
        searchOptions: { boost: { title: 2 }, fuzzy: 0.2 }
      });
    } catch (err) {
      console.error('검색 인덱스 로딩 오류:', err);
    }
  }

  // 검색어 하이라이트 함수
  function highlight(text, terms) {
    if (!text) return '';
    let res = String(text);
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      res = res.replace(regex, '<mark>$1</mark>');
    });
    return res;
  }

  let debounceTimer = null;
  let selectedIndex = -1;
  let currentResults = [];

  function performSearch(query) {
    if (!miniSearch) return;
    
    if (!query.trim()) {
      resultsDiv.classList.remove('active');
      resultsDiv.innerHTML = '';
      currentResults = [];
      selectedIndex = -1;
      return;
    }

    const results = miniSearch.search(query);
    currentResults = results.slice(0, 10);
    selectedIndex = -1;

    if (currentResults.length === 0) {
      resultsDiv.innerHTML = '<div class="search-result-item"><span class="search-result-title">결과가 없습니다.</span></div>';
    } else {
      const terms = query.trim().split(/\s+/);
      resultsDiv.innerHTML = currentResults.map((res, i) => `
        <a href="/posts/${encodeURIComponent(res.slug)}" class="search-result-item" data-index="${i}">
          <div class="search-result-title">${highlight(res.title, terms)}</div>
          <div class="search-result-excerpt">${highlight(res.excerpt, terms)}</div>
        </a>
      `).join('');
    }
    
    resultsDiv.classList.add('active');
    input.setAttribute('aria-expanded', 'true');
  }

  function updateSelection() {
    const items = resultsDiv.querySelectorAll('.search-result-item');
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  input.addEventListener('focus', () => {
    loadIndex();
    if (input.value.trim()) resultsDiv.classList.add('active');
  });

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(e.target.value), 200);
  });

  input.addEventListener('keydown', (e) => {
    if (!resultsDiv.classList.contains('active') || currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
        window.location.href = `/posts/${encodeURIComponent(currentResults[selectedIndex].slug)}`;
      } else if (currentResults.length > 0) {
        window.location.href = `/posts/${encodeURIComponent(currentResults[0].slug)}`;
      }
    } else if (e.key === 'Escape') {
      resultsDiv.classList.remove('active');
      input.blur();
    }
  });

  // 단축키 (Cmd+K / Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.classList.remove('active');
      input.setAttribute('aria-expanded', 'false');
    }
  });
})();
