'use client';

import { useEffect, useRef } from 'react';

/**
 * Reads an `?openId=<id>` query param (set by Journal Entry "Go to source"
 * navigation) and invokes `onOpen(id)` once, so the destination list page can
 * auto-open that record's existing detail view.
 *
 * Reads straight from `window.location.search` rather than `useSearchParams()`,
 * because on a full page load that hook can return empty params during the first
 * client render (App Router CSR deopt), which made the auto-open miss. The param
 * is intentionally left in the URL — calling `router.replace` to strip it
 * remounts the page (App Router) and resets the just-set detail state.
 *
 * @param onOpen  called with the id from `?openId=`.
 * @param ready   optional gate — defer until data is loaded (e.g. the list has
 *                been fetched) so a list-derived detail view has what it needs.
 */
export function useOpenIdParam(onOpen: (id: string) => void, ready: boolean = true) {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !ready) return;
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('openId');
    if (!id) return;
    handled.current = true;
    onOpen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
