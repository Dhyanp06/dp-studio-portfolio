import { LINKS } from './profile';

/**
 * The link button shown in the full-view popup when someone clicks an image.
 *
 * - By default every image links to your "Portfolio projects" link from src/data/profile.ts.
 * - To give ONE image its own link, add a line below. The key is the image name used in the
 *   data files (the file name without its extension), e.g. 'logos-1', 'early-2', 'craft-type-1'.
 * - Use `''` (empty) to hide the link button for a particular image.
 *
 *   'reels-1': 'https://www.instagram.com/reel/your-reel/',
 *   'creatpix-1': { href: 'https://example.com/case-study', label: 'Read the case study' },
 */
export const IMAGE_LINKS: Record<string, string | { href: string; label?: string }> = {
   'reels-1': 'https://ecomspy.io/',
};

export interface ImageLink {
  href: string;
  label: string;
}

const DEFAULT_LABEL = 'Open link';

/** Only normal web links (and mailto:) are allowed — never javascript: or data: URLs. */
function safe(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** The link to show for an image (by its data-file name), or null for no link button. */
export function linkFor(imageName?: string): ImageLink | null {
  const own = imageName ? IMAGE_LINKS[imageName] : undefined;
  if (own === '' || (typeof own === 'object' && own.href === '')) return null;

  if (own) {
    const href = safe(typeof own === 'string' ? own : own.href);
    if (href) return { href, label: typeof own === 'string' ? DEFAULT_LABEL : (own.label ?? DEFAULT_LABEL) };
  }
  const fallback = LINKS.find((l) => l.kind === 'portfolio')?.href;
  const href = fallback ? safe(fallback) : null;
  return href ? { href, label: DEFAULT_LABEL } : null;
}
