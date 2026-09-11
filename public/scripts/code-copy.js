/**
 * Add copy buttons to highlighted code blocks (pre.shiki / pre:not(.mermaid)).
 */
(function () {
  function label(btn, text) {
    btn.textContent = text;
    btn.setAttribute('aria-label', text);
  }

  function enhance(pre) {
    if (pre.dataset.copyReady) return;
    if (pre.classList.contains('mermaid')) return;
    pre.dataset.copyReady = '1';

    var wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    label(btn, '복사');

    btn.addEventListener('click', function () {
      var text = pre.textContent || '';
      function ok() {
        label(btn, '복사됨');
        setTimeout(function () { label(btn, '복사'); }, 1500);
      }
      function fail() {
        label(btn, '실패');
        setTimeout(function () { label(btn, '복사'); }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fail);
      } else {
        fail();
      }
    });

    wrap.appendChild(btn);
  }

  function run() {
    document.querySelectorAll('pre:not(.mermaid)').forEach(enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
