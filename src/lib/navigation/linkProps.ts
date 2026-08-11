import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { MouseEvent } from 'react';

function shouldUseNativeNavigation(e: MouseEvent<HTMLElement>) {
  return (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
  );
}

/**
 * Turns a router.push handler into a real link.
 *
 * Spread onto an <a> (or antd <Button>) to get an href the browser understands:
 * Ctrl/Cmd+click, middle-click and "Open in new tab" all work natively, while a
 * plain left-click still does a client-side push (no full page reload).
 */
export function linkProps(href: string, router: AppRouterInstance) {
  return {
    href,
    onClick: (e: MouseEvent<HTMLElement>) => {
      // Let the browser own any click that is asking for a new tab/window.
      if (shouldUseNativeNavigation(e)) return;
      e.preventDefault();
      router.push(href);
    },
  };
}

/**
 * Gives a modal/drawer trigger a real destination without changing plain click.
 * Modified clicks use the href; a normal click runs the existing local action.
 */
export function actionLinkProps(href: string, onPlainClick: () => void) {
  return {
    href,
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (shouldUseNativeNavigation(e)) return;
      e.preventDefault();
      onPlainClick();
    },
  };
}
