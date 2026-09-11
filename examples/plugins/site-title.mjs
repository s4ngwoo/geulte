/**
 * 예제 플러그인 — 사이트 제목 접미사 + afterGenerate 로그
 *
 * 프로젝트 루트에 geulte.config.mjs:
 *
 *   import { siteTitlePlugin } from './examples/plugins/site-title.mjs';
 *   export default { plugins: [siteTitlePlugin({ suffix: ' · Geulte' })] };
 */

/** @param {{ suffix?: string }} [opts] */
export function siteTitlePlugin(opts = {}) {
  const suffix = opts.suffix ?? ' · Geulte';
  return {
    name: 'site-title',
    onConfig(config) {
      const title = config.site.title;
      if (title.endsWith(suffix)) return config;
      return {
        ...config,
        site: { ...config.site, title: `${title}${suffix}` },
      };
    },
    async afterGenerate(ctx) {
      console.log(`[site-title] built ${ctx.posts.size} posts → ${ctx.outDir}`);
    },
  };
}

export default siteTitlePlugin;
