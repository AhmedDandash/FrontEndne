/**
 * API Error Helper
 *
 * Extracts a human-readable message from an axios error. Two error envelopes
 * coexist on this backend (verified live):
 *   1. Custom: `{ success: false, errors: string[], message?, statusCode }`
 *   2. ASP.NET ProblemDetails: `{ title, status, errors: { Field: string[] } }`
 *      — here `errors` is an OBJECT of field→messages, not an array.
 * Both shapes are flattened so field-level validation surfaces to the user.
 *
 * Pass a bilingual fallback ("عربي / English") for when the server sends nothing
 * useful. Replaces the copy-pasted `error.response?.data?.message || '...'`
 * pattern that was duplicated across every mutation hook.
 */
export function getApiErrorMessage(err: any, fallback: string): string {
  if (err?.response?.status === 403) {
    return 'ليست لديك صلاحية لتنفيذ هذا الإجراء / You do not have permission to perform this action';
  }

  const data = err?.response?.data;
  const errors = data?.errors;

  let fromErrors = '';
  if (Array.isArray(errors)) {
    // Custom envelope: errors is a string[]
    fromErrors = errors.filter(Boolean).join(' • ');
  } else if (errors && typeof errors === 'object') {
    // ASP.NET ProblemDetails: errors is { field: string[] } — flatten all
    // messages so field-level validation surfaces instead of the generic title.
    fromErrors = Object.values(errors)
      .flat()
      .filter(Boolean)
      .join(' • ');
  }

  return fromErrors || data?.message || data?.title || fallback;
}
