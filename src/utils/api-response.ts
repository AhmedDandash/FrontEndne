/**
 * API Response Helpers
 *
 * The Sigma API is inconsistent in how it wraps payloads. Across endpoints we see:
 *   - a flat array / object
 *   - the standard envelope `{ success, statusCode, message, data }`
 *   - paginated `{ data: { items: [...] , totalCount } }`
 *   - `{ items: [...] }` / `{ result: [...] }` / `{ data: [...] }`
 *   - System.Text.Json reference handling `{ $values: [...] }`
 *
 * Before this helper existed every service (and several UI pages) re-implemented
 * its own unwrap logic, each handling a slightly different subset of shapes. These
 * two functions are the single source of truth — use them everywhere.
 */

/**
 * Peel the meaningful payload out of the standard ApiResponse envelope.
 * Returns the inner object/value, or the raw payload if it is not wrapped.
 */
export function unwrap<T>(payload: any): T {
  const inner = payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
  return inner as T;
}

/**
 * Normalise any of the known list shapes into a plain array.
 * Always returns an array — never null/undefined — so callers can `.map()` safely.
 */
export function unwrapList<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];

  // Drill through the envelope before checking list keys.
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.$values)) return data.$values as T[];
  if (Array.isArray(data?.result)) return data.result as T[];

  // Some endpoints nest one level deeper: { data: { items: [...] } }
  if (Array.isArray(payload?.data?.items)) return payload.data.items as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.result)) return payload.result as T[];

  return [];
}
