import { z } from 'zod';

// ─── Frontmatter 스키마 ──────────────────────────────────────────────────────
// 모든 분류 필드는 optional — 없어도 빌드가 깨지지 않는다.

const PostTypeEnum = z.enum(['note', 'tutorial', 'review', 'log']).optional();

export const FrontmatterSchema = z.object({
  title: z.string().optional(),
  date: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v)))
    .optional(),
  updated: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v)))
    .optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (typeof v === 'string' ? [v] : v))
    .default([]),
  topics: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (typeof v === 'string' ? [v] : v))
    .default([]),
  keywords: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (typeof v === 'string' ? [v] : v))
    .default([]),
  category: z.string().optional(),
  type: PostTypeEnum,
  series: z.string().optional(),
  lang: z.string().optional(),
  draft: z.boolean().default(false),
  description: z.string().optional(),
  /** 대표/커버 이미지 (OG 우선) */
  cover: z.string().optional(),
  image: z.string().optional(),
}).passthrough(); // 알 수 없는 필드는 통과시켜 빌드를 깨지 않음

export type ValidatedFrontmatter = z.infer<typeof FrontmatterSchema>;

// ─── SiteConfig 스키마 ───────────────────────────────────────────────────────

const TaxonomyConfigSchema = z.object({
  label: z.string(),
  slug: z.string(),
});

const TagCloudConfigSchema = z
  .object({
    position: z.enum(['sidebar', 'footer']).default('sidebar'),
    maxItems: z.number().int().positive().default(50),
  })
  .default({});

const RecentPostsConfigSchema = z
  .object({
    count: z.number().int().positive().default(5),
  })
  .default({});

const PopularPostsConfigSchema = z
  .object({
    metric: z.enum(['backlinks', 'views']).default('backlinks'),
    count: z.number().int().positive().default(5),
  })
  .default({});

const RssConfigSchema = z
  .object({
    fullContent: z.boolean().default(false),
    count: z.number().int().positive().default(20),
  })
  .default({});

const AuthorConfigSchema = z.union([
  z.string(),
  z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    bio: z.string().optional(),
  }),
]);

const SocialConfigSchema = z
  .object({
    email: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    x: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    bluesky: z.string().optional(),
    threads: z.string().optional(),
    mastodon: z.string().optional(),
    website: z.string().optional(),
  })
  .catchall(z.string())
  .default({});

const CommentsConfigSchema = z
  .object({
    provider: z.enum(['giscus', 'utterances', 'none']).default('none'),
    // Giscus 전용 설정
    giscus: z
      .object({
        repo: z.string(),                              // "owner/repo"
        repoId: z.string(),                            // Giscus 설정 페이지에서 복사
        category: z.string().default('General'),       // Discussions 카테고리 이름
        categoryId: z.string(),                        // Giscus 설정 페이지에서 복사
        mapping: z.enum(['pathname', 'url', 'title', 'og:title', 'specific', 'number']).default('pathname'),
        strict: z.boolean().default(false),
        reactionsEnabled: z.boolean().default(true),
        emitMetadata: z.boolean().default(false),
        inputPosition: z.enum(['top', 'bottom']).default('bottom'),
        lang: z.string().default('ko'),
      })
      .optional(),
  })
  .default({ provider: 'none' });

export const SiteConfigSchema = z.object({
  site: z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
    author: AuthorConfigSchema.optional(),
    email: z.string().optional(),
    social: SocialConfigSchema.optional(),
  }),
  taxonomy: z
    .object({
      tags: TaxonomyConfigSchema.optional(),
      topics: TaxonomyConfigSchema.optional(),
      keywords: TaxonomyConfigSchema.optional(),
      category: TaxonomyConfigSchema.optional(),
    })
    .default({}),
  theme: z
    .object({
      darkMode: z.boolean().default(true),
      sidebar: z.enum(['left', 'right', 'both']).default('left'),
      toc: z.enum(['left', 'right', 'none']).default('right'),
      accentColor: z.string().optional(),
      tagCloud: TagCloudConfigSchema.default({}),
      recentPosts: RecentPostsConfigSchema.default({}),
      popularPosts: PopularPostsConfigSchema.default({}),
    })
    .default({}),
  database: z
    .object({
      provider: z.literal('supabase'),
      url: z.string(),
      key: z.string(),
    })
    .optional(),
  build: z
    .object({
      output: z.string().default('dist'),
      incremental: z.boolean().default(false),
      baseUrl: z.string().optional(),
      images: z
        .object({
          enabled: z.boolean().default(false),
          widths: z.array(z.number().int().positive()).default([640, 1280]),
          format: z.enum(['webp', 'avif']).default('webp'),
        })
        .optional(),
    })
    .default({}),
  rss: RssConfigSchema,
  comments: CommentsConfigSchema,
  i18n: z
    .object({
      defaultLocale: z.string().default('ko'),
      locales: z
        .array(
          z.object({
            code: z.string(),
            label: z.string(),
          })
        )
        .default([
          { code: 'ko', label: '한국어' },
          { code: 'en', label: 'English' },
        ]),
    })
    .default({
      defaultLocale: 'ko',
      locales: [
        { code: 'ko', label: '한국어' },
        { code: 'en', label: 'English' },
      ],
    }),
});

export type ValidatedSiteConfig = z.infer<typeof SiteConfigSchema>;

// ─── 검증 헬퍼 ───────────────────────────────────────────────────────────────

/**
 * frontmatter를 검증한다.
 * 파싱 오류 시 경고만 출력하고 부분 결과를 반환한다 (빌드 미실패).
 */
export function validateFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): ValidatedFrontmatter {
  const result = FrontmatterSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.warn(
      `\x1b[33m⚠  Frontmatter 경고 [${filePath}]:\n${issues}\x1b[0m`,
    );
    // 실패 필드를 제외하고 최대한 파싱한 결과 반환
    return FrontmatterSchema.parse({
      ...raw,
      tags: [],
      topics: [],
      keywords: [],
      draft: false,
      lang: undefined,
    });
  }
  return result.data;
}
