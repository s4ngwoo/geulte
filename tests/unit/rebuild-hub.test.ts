import { describe, expect, it } from 'vitest';
import {
  RebuildHub,
  injectLiveReloadScript,
  LIVE_RELOAD_CLIENT_SCRIPT,
} from '../../src/application/dev/rebuild-hub.js';

describe('RebuildHub', () => {
  it('notifies all subscribers on reload', () => {
    const hub = new RebuildHub();
    const events: unknown[] = [];
    hub.subscribe((e) => events.push(e));
    hub.subscribe((e) => events.push(e));
    hub.notify({ type: 'reload' });
    expect(events).toEqual([{ type: 'reload' }, { type: 'reload' }]);
    expect(hub.listenerCount).toBe(2);
  });

  it('unsubscribe stops delivery', () => {
    const hub = new RebuildHub();
    const events: unknown[] = [];
    const unsub = hub.subscribe((e) => events.push(e));
    unsub();
    hub.notify({ type: 'reload' });
    expect(events).toEqual([]);
    expect(hub.listenerCount).toBe(0);
  });
});

describe('injectLiveReloadScript', () => {
  it('injects before </body>', () => {
    const out = injectLiveReloadScript('<html><body><p>x</p></body></html>');
    expect(out).toContain(LIVE_RELOAD_CLIENT_SCRIPT);
    expect(out.indexOf('<script>')).toBeLessThan(out.indexOf('</body>'));
  });

  it('appends when no body tag', () => {
    const out = injectLiveReloadScript('<p>x</p>');
    expect(out.endsWith(`<script>${LIVE_RELOAD_CLIENT_SCRIPT}</script>`)).toBe(true);
  });
});
