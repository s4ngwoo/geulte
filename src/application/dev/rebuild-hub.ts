export type RebuildEvent = { type: 'reload' } | { type: 'error'; message: string };

export type RebuildListener = (event: RebuildEvent) => void;

/**
 * Application: 리빌드 결과를 구독자에게 알린다.
 * Transport(SSE/WS)는 Adapter.
 */
export class RebuildHub {
  private listeners = new Set<RebuildListener>();

  subscribe(listener: RebuildListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(event: RebuildEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

/** HTML에 삽입할 라이브 리로드 클라이언트 (dev serve 전용). */
export const LIVE_RELOAD_CLIENT_SCRIPT = `(function(){
  try {
    var es = new EventSource('/_geulte/livereload');
    es.onmessage = function(ev){
      try {
        var data = JSON.parse(ev.data);
        if (data && data.type === 'reload') location.reload();
      } catch (e) {}
    };
    es.onerror = function(){ /* browser retries */ };
  } catch (e) {}
})();`;

export function injectLiveReloadScript(html: string): string {
  const tag = `<script>${LIVE_RELOAD_CLIENT_SCRIPT}</script>`;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${tag}</body>`);
  }
  return html + tag;
}
