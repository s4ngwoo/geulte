export interface ImageVariantPlan {
  width: number;
  /** relative output path under dist, e.g. assets/opt/foo-640.webp */
  outRel: string;
}

export interface ImageOptimizePlan {
  /** original src as found in HTML */
  src: string;
  /** absolute or project-relative source file to read */
  skip: boolean;
  reason?: 'remote' | 'svg' | 'data' | 'empty';
  variants: ImageVariantPlan[];
}

/** Remote / data / svg → skip. Local paths get width variants. */
export function planImageOptimization(
  src: string,
  widths: number[],
  format: 'webp' | 'avif' = 'webp',
): ImageOptimizePlan {
  const trimmed = src.trim();
  if (!trimmed) return { src, skip: true, reason: 'empty', variants: [] };
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return { src, skip: true, reason: 'remote', variants: [] };
  }
  if (trimmed.startsWith('data:')) {
    return { src, skip: true, reason: 'data', variants: [] };
  }
  if (/\.svg(\?|#|$)/i.test(trimmed)) {
    return { src, skip: true, reason: 'svg', variants: [] };
  }

  const clean = trimmed.replace(/^\.\//, '').replace(/^\//, '');
  const base = clean.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9/_-]/g, '-');
  const uniqueWidths = [...new Set(widths)].filter((w) => w > 0).sort((a, b) => a - b);

  return {
    src,
    skip: false,
    variants: uniqueWidths.map((width) => ({
      width,
      outRel: `assets/opt/${base}-${width}.${format}`,
    })),
  };
}

/**
 * Rewrite <img src="..."> for a single planned local image to use srcset of variants.
 * Leaves other attributes intact.
 */
export function rewriteImgTagForPlan(html: string, plan: ImageOptimizePlan): string {
  if (plan.skip || plan.variants.length === 0) return html;

  const escaped = plan.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<img\\b[^>]*\\bsrc=["'])${escaped}(["'][^>]*>)`, 'gi');

  const srcset = plan.variants.map((v) => `/${v.outRel} ${v.width}w`).join(', ');
  const fallback = `/${plan.variants[plan.variants.length - 1].outRel}`;

  return html.replace(re, (_m, pre: string, post: string) => {
    let tag = `${pre}${fallback}${post}`;
    if (/\bsrcset=/.test(tag)) {
      tag = tag.replace(/\bsrcset=["'][^"']*["']/, `srcset="${srcset}"`);
    } else {
      tag = tag.replace(/^<img\b/i, `<img srcset="${srcset}"`);
    }
    if (!/\bsizes=/.test(tag)) {
      tag = tag.replace(/^<img\b/i, `<img sizes="(max-width: 768px) 100vw, 768px"`);
    }
    return tag;
  });
}

/** Collect unique local img src values from HTML. */
export function extractImgSrcs(html: string): string[] {
  const srcs: string[] = [];
  const re = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    srcs.push(m[1]);
  }
  return [...new Set(srcs)];
}
