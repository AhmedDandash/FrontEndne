/**
 * Excel / file export helpers.
 *
 * `exportBlob` performs an authenticated GET that streams a file (e.g. the
 * `/export` endpoints which return an .xlsx). `triggerBlobDownload` saves a Blob
 * to disk using the server's Content-Disposition filename when available.
 */

import type { AxiosResponse } from 'axios';
import { api } from '@/lib/api/client';

/** Parse the download filename from a Content-Disposition header, if present. */
function filenameFromResponse(response: AxiosResponse, fallback: string): string {
  const cd = (response.headers?.['content-disposition'] ??
    response.headers?.['Content-Disposition']) as string | undefined;
  if (cd) {
    // Prefer RFC 5987 `filename*=UTF-8''name.xlsx`, then plain `filename=name.xlsx`.
    const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
    if (star?.[1]) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    const plain = /filename=([^;]+)/i.exec(cd);
    if (plain?.[1]) return plain[1].trim().replace(/^"|"$/g, '');
  }
  return fallback;
}

/** Save a Blob to disk, triggering the browser's download flow. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * GET a file endpoint with the given query params and download it. Uses the
 * server filename when provided, otherwise `fallbackName`.
 */
export async function exportBlob(
  endpoint: string,
  params: Record<string, string | number | boolean>,
  fallbackName: string
): Promise<void> {
  const response = await api.get(endpoint, { params, responseType: 'blob' });
  const blob = response.data as Blob;
  const filename = filenameFromResponse(response, fallbackName);
  triggerBlobDownload(blob, filename);
}
