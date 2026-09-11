// 글터(Geulte) 공통 타입 정의

export interface FrontmatterRaw {
  title?: string;
  date?: string | Date;
  updated?: string | Date;
  tags?: string[];
  topics?: string[];
  keywords?: string[];
  category?: string;
  type?: string;
  series?: string;
  lang?: string;
  draft?: boolean;
  [key: string]: unknown;
}

export type PostType = 'note' | 'tutorial' | 'review' | 'log';

export interface PostMeta {
  slug: string;
  title: string;
  date: Date;
  updated?: Date;
  tags: string[];
  topics: string[];
  keywords: string[];
  category?: string;
  type?: PostType;
  series?: string;
  /** 콘텐츠 언어 (미지정 시 config i18n.defaultLocale) */
  lang?: string;
  draft: boolean;
  /** SEO용 수동 설명 (없으면 excerpt) */
  description?: string;
  /** 커버/대표 이미지 URL 또는 사이트 상대 경로 */
  cover?: string;
  image?: string;
  /** 파일 시스템 절대 경로 */
  filePath: string;
  /** 발췌문 (검색 인덱스용, 최초 200자) */
  excerpt?: string;
  /** 조회수 (선택적 확장 필드) */
  view_count?: number;
  /** 역방향 링크(언급) 수 */
  backlink_count?: number;
}

export interface Post extends PostMeta {
  /** remark/rehype가 생성한 렌더링된 HTML */
  contentHtml: string;
  /** wikilink가 참조하는 slug 목록 (백링크 계산용) */
  outLinks: string[];
  /** TOC 항목 목록 */
  toc: TocItem[];
}

export interface TocItem {
  depth: number;
  id: string;
  text: string;
}

/** 백링크 맵: targetSlug → 해당 글을 링크한 소스 Post 목록 */
export type BacklinkMap = Map<string, PostMeta[]>;

export interface SiteAuthorConfig {
  name?: string;
  email?: string;
  bio?: string;
}

export interface SiteSocialConfig {
  email?: string;
  github?: string;
  twitter?: string;
  x?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  bluesky?: string;
  threads?: string;
  mastodon?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface SiteConfig {
  site: {
    title: string;
    url: string;
    description?: string;
    author?: string | SiteAuthorConfig;
    email?: string;
    social?: SiteSocialConfig;
  };
  taxonomy: {
    tags?: TaxonomyConfig;
    topics?: TaxonomyConfig;
    keywords?: TaxonomyConfig;
    category?: TaxonomyConfig;
  };
  theme: {
    darkMode: boolean;
    sidebar: 'left' | 'right' | 'both';
    toc: 'left' | 'right' | 'none';
    accentColor?: string;
    tagCloud?: {
      position?: 'sidebar' | 'footer';
      maxItems?: number;
    };
    recentPosts?: {
      count?: number;
    };
    popularPosts?: {
      metric?: 'backlinks' | 'views';
      count?: number;
    };
  };
  database?: {
    provider: 'supabase';
    url: string;
    key: string;
  };
  build: {
    output: string;
    incremental?: boolean;
    baseUrl?: string;
    images?: {
      enabled?: boolean;
      widths?: number[];
      format?: 'webp' | 'avif';
    };
  };
  rss?: {
    fullContent?: boolean;
    count?: number;
  };
  comments?: {
    provider: 'giscus' | 'utterances' | 'none';
    giscus?: {
      repo: string;
      repoId: string;
      category: string;
      categoryId: string;
      mapping: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
      strict: boolean;
      reactionsEnabled: boolean;
      emitMetadata: boolean;
      inputPosition: 'top' | 'bottom';
      lang: string;
    };
  };
  i18n: {
    defaultLocale: string;
    locales: { code: string; label: string }[];
  };
}

export interface TaxonomyConfig {
  label: string;
  slug: string;
}

/** 정적 생성 시 각 페이지에 전달되는 렌더 컨텍스트 */
export interface RenderContext {
  site: SiteConfig['site'];
  theme: SiteConfig['theme'];
  taxonomy: SiteConfig['taxonomy'];
  /** 현재 페이지 제목 */
  pageTitle: string;
  /** 현재 URL 경로 */
  currentPath: string;
  /** 좌측 사이드바용 데이터 */
  sidebar: SidebarData;
  [key: string]: unknown;
}

/** 공통 베이스 렌더 컨텍스트 (pageTitle, currentPath 제외) */
export interface BaseRenderContext {
  site: SiteConfig['site'];
  theme: SiteConfig['theme'];
  taxonomy: SiteConfig['taxonomy'];
  sidebar: SidebarData;
  comments?: SiteConfig['comments'];
  // i18n 지원
  locale: string;
  localePrefix: string; // 기본 언어는 '', 그 외는 '/en'
  locales: SiteConfig['i18n']['locales'];
  t: (key: string) => string; // 다국어 번역 함수
  siteUrl: string; // 현재 언어의 사이트 URL
}

export interface SidebarData {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
  tagCloud: TagCloudItem[];
  topics: TaxonomyItem[];
  keywords: TaxonomyItem[];
  recentPosts: PostMeta[];
  popularPosts: PostMeta[];
  series: string[];
}

export interface TaxonomyItem {
  name: string;
  count: number;
  slug: string;
}

export interface TagCloudItem extends TaxonomyItem {
  /** 1~4 단계 정규화 티어 (1: 최소 크기/흐림, 4: 최대 크기/진함) */
  tier: 1 | 2 | 3 | 4;
}

/** 검색 인덱스에 저장되는 문서 구조 */
export interface SearchDoc {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  category?: string;
  date: string;
  slug: string;
}
