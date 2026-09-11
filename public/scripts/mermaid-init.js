/**
 * Client-side Mermaid init for <pre class="mermaid"> blocks produced at build time.
 * Theme follows document data-theme (dark/light).
 */
(function () {
  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';
  }

  function run() {
    var nodes = document.querySelectorAll('pre.mermaid');
    if (!nodes.length) return;

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.onload = function () {
      if (!window.mermaid) return;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme(),
        securityLevel: 'strict',
      });
      window.mermaid.run({ nodes: nodes });
    };
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
