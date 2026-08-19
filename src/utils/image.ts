const R2_CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://pub-f187258d7c85424fa237dc86a126271b.r2.dev';

/**
 * Normalizes an uploadImage value to an absolute URL.
 * The API sometimes returns relative paths (e.g. /worker-images/uuid.jpg)
 * for older records; this prefixes the R2 CDN base so browsers can load them.
 */
export function resolveImageUrl(src: string | File | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src instanceof File) return URL.createObjectURL(src);
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  return `${R2_CDN_BASE}${src.startsWith('/') ? src : `/${src}`}`;
}
