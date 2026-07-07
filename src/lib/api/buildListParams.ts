/**
 * Build a clean query-params object for list + export requests.
 *
 * - Drops null / undefined / '' values so the backend doesn't try to bind them.
 * - Keeps `false` and `0` (they are meaningful).
 * - Handles the pagination param-name quirk: most modules use `pageNumber`, but
 *   Mediation contracts and HR Employees use `page`. Pass `{ pageParam: 'page' }`
 *   for those; the incoming `pageNumber` is re-emitted under the right name.
 *
 * The SAME builder is used by a list call and its `/export` counterpart so the
 * two never drift (the export endpoints accept identical filters).
 */
export interface BuildListParamsOptions {
  /** Query key used for the page index. Defaults to 'pageNumber'. */
  pageParam?: 'pageNumber' | 'page';
}

export function buildListParams(
  filters: Record<string, unknown> | undefined,
  options: BuildListParamsOptions = {}
): Record<string, string | number | boolean> {
  const { pageParam = 'pageNumber' } = options;
  const out: Record<string, string | number | boolean> = {};
  if (!filters) return out;

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') continue;

    // Remap the page index onto the module-specific param name.
    if (key === 'pageNumber' || key === 'page') {
      out[pageParam] = value as number;
      continue;
    }

    out[key] = value as string | number | boolean;
  }

  return out;
}
