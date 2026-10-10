/**
 * Resolve a project file name to a URL.
 *
 * Drop your images / videos into `src/assets/projects/` and reference them by
 * file name only, e.g. `image: 'social-01.jpg'` in `src/data/projects.ts`.
 * Full URLs (https://…) and absolute paths (/projects/x.jpg, served from
 * /public) also work.
 */
const files = import.meta.glob('../assets/projects/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function projectAsset(name?: string): string | undefined {
  if (!name) return undefined;
  if (/^(https?:)?\/\//.test(name) || name.startsWith('/') || name.startsWith('data:')) return name;
  const hit = Object.entries(files).find(([path]) => path.endsWith(`/${name}`));
  return hit?.[1];
}
