/**
 * API Error Helper
 *
 * Extracts a human-readable message from an axios error. The Sigma API error
 * envelope is `{ success: false, errors: [...], message?, statusCode }`, so
 * validation details (e.g. "debit total != credit total") arrive in `errors[]`
 * while higher-level failures use `message` / `title`.
 *
 * Pass a bilingual fallback ("عربي / English") for when the server sends nothing
 * useful. Replaces the copy-pasted `error.response?.data?.message || '...'`
 * pattern that was duplicated across every mutation hook.
 */
export function getApiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  const fromArray = Array.isArray(data?.errors)
    ? data.errors.filter(Boolean).join(' • ')
    : '';
  return fromArray || data?.message || data?.title || fallback;
}
