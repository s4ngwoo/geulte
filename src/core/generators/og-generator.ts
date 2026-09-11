import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PostMeta, SiteConfig } from '../../types.js';
import { wrapText } from '../../domain/wrap-text.js';

// tsup은 dist/cli/index.js 단일 번들로 출력한다.
// import.meta.url = file:///…/dist/cli/index.js (또는 dist/index.js)
// 따라서 dirname(…) = dist/cli/ → ../../public/fonts/ 가 프로젝트 루트의 public/fonts/
const __bundleDir = dirname(fileURLToPath(import.meta.url));

/** dist/cli 번들·src/core/generators 소스 양쪽에서 public/fonts 를 찾는다. */
function resolveBuiltinFontPath(): string {
  const candidates = [
    join(__bundleDir, '../../public/fonts/NotoSansKR-Bold.ttf'), // dist/cli → repo public
    join(__bundleDir, '../../../public/fonts/NotoSansKR-Bold.ttf'), // src/core/generators
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[0];
}

const BUILTIN_FONT_PATH = resolveBuiltinFontPath();

export interface OgGeneratorOptions {
  outDir: string;
  config: SiteConfig;
  postMetas: PostMeta[];
}

/** 사용자 public/fonts → 빌트인 순. 둘 다 없으면 null (생성 스킵). */
export function resolveOgFontPath(outDir: string, builtinPath = BUILTIN_FONT_PATH): string | null {
  const userFontPath = join(outDir, '..', 'public', 'fonts', 'NotoSansKR-Bold.ttf');
  if (existsSync(userFontPath)) return userFontPath;
  if (existsSync(builtinPath)) return builtinPath;
  return null;
}

/**
 * satori VNode 구조로 OG 이미지 레이아웃 생성
 */
function buildOgNode(
  title: string,
  category: string | undefined,
  siteTitle: string,
  date: Date,
): object {
  const dateStr = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const titleLines = wrapText(title, 22);

  // 카테고리 뱃지
  const categoryBadge = category
    ? {
        type: 'div',
        props: {
          // 외부 flex row → 뱃지가 내용 크기만큼만 차지
          style: {
            display: 'flex',
            flexDirection: 'row',
            marginBottom: '24px',
          },
          children: {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(88, 166, 255, 0.15)',
                border: '1px solid rgba(88, 166, 255, 0.4)',
                borderRadius: '8px',
                padding: '6px 16px',
              },
              children: {
                type: 'span',
                props: {
                  style: { color: '#58a6ff', fontSize: '26px', fontWeight: 700 },
                  children: category,
                },
              },
            },
          },
        },
      }
    : null;

  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        padding: '64px 72px',
        position: 'relative',
        fontFamily: 'NotoSansKR',
      },
      children: [
        // 배경 장식 원
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 70%)',
            },
            children: '',
          },
        },
        // 콘텐츠
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'flex-end',
            },
            children: [
              // 카테고리 뱃지
              ...(categoryBadge ? [categoryBadge] : []),
              // 제목
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '32px',
                  },
                  children: titleLines.map((line) => ({
                    type: 'span',
                    props: {
                      style: {
                        color: '#e6edf3',
                        fontSize: titleLines.length > 1 ? '52px' : '64px',
                        fontWeight: 700,
                        lineHeight: 1.25,
                        letterSpacing: '-0.02em',
                      },
                      children: line,
                    },
                  })),
                },
              },
              // 하단 구분선 + 메타
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '24px',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: { color: '#8b949e', fontSize: '22px' },
                        children: siteTitle,
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: { color: '#8b949e', fontSize: '22px' },
                        children: dateStr,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * OG 이미지를 단일 포스트에 대해 생성 (PNG Buffer 반환)
 */
async function renderOgImage(
  post: PostMeta,
  siteTitle: string,
  fontData: Buffer,
): Promise<Buffer> {
  // 동적 import — 빌드 시 항상 사용 가능하도록
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');

  const node = buildOgNode(post.title, post.category, siteTitle, post.date);

  const svg = await satori(node as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'NotoSansKR',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: false },
  });
  return Buffer.from(resvg.render().asPng());
}

/**
 * 모든 포스트의 OG 이미지를 dist/og/{slug}.png 로 생성
 */
export async function generateOgImages(opts: OgGeneratorOptions): Promise<void> {
  const { outDir, config, postMetas } = opts;
  const siteTitle = config.site.title;

  const fontPath = resolveOgFontPath(outDir);
  if (!fontPath) {
    console.warn('\x1b[33m⚠  OG 이미지 폰트 없음 — 생성 건너뜀\x1b[0m');
    return;
  }

  const fontData = readFileSync(fontPath);
  const ogDir = join(outDir, 'og');
  mkdirSync(ogDir, { recursive: true });

  const published = postMetas.filter((p) => !p.draft);
  let count = 0;

  for (const post of published) {
    try {
      const png = await renderOgImage(post, siteTitle, fontData);
      writeFileSync(join(ogDir, `${post.slug}.png`), png);
      count++;
    } catch (err) {
      console.warn(
        `\x1b[33m⚠  OG 이미지 생성 실패 [${post.slug}]: ${(err as Error).message}\x1b[0m`,
      );
    }
  }

  console.log(`\x1b[32m✓ OG 이미지 생성: ${count}개 → dist/og/\x1b[0m`);
}
