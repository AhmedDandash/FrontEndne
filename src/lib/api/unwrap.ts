/**
 * Shared response-unwrapping and error-extraction helpers for the Sigma API.
 *
 * The backend uses two envelope shapes that callers must tolerate:
 *  1. Business envelope: { success, data, errors: string[], statusCode }
 *  2. ASP.NET ProblemDetails (model-validation): { title, status, errors: { Field: string[] }, traceId }
 *
 * These helpers normalise both so feature code never has to special-case them.
 */

/** Unwrap a single object from any of the known envelope shapes. */
export function unwrap<T>(payload: any): T {
  return (payload?.data?.value ?? payload?.value ?? payload?.data ?? payload) as T;
}

/** Unwrap an array from any of the known envelope shapes (incl. $values from ReferenceHandler). */
export function unwrapList<T>(payload: any): T[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.value,
    payload?.value,
    payload?.data?.items,
    payload?.value?.items,
    payload?.items,
    payload?.data?.result,
    payload?.result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
    if (Array.isArray(c?.$values)) return c.$values as T[];
  }
  return [];
}

/**
 * Extract a user-facing error message from an Axios error, supporting both the
 * business envelope (`errors: string[]` / `message`) and ProblemDetails
 * (`errors: { field: string[] }` / `title`). Falls back to `fallback`.
 */
export function extractApiError(err: unknown, fallback: string): string {
  if ((err as any)?.response?.status === 403) {
    return 'ليست لديك صلاحية لتنفيذ هذا الإجراء / You do not have permission to perform this action';
  }

  const d = (err as any)?.response?.data;
  if (!d) return (err as any)?.message || fallback;

  // Business envelope — errors is a string array.
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    return String(d.errors[0]);
  }

  // ProblemDetails — errors is an object keyed by field name.
  if (d.errors && typeof d.errors === 'object') {
    const firstField = Object.values(d.errors as Record<string, unknown>)
      .flat()
      .find(Boolean);
    if (firstField) return String(firstField);
  }

  return d.message || d.title || fallback;
}
