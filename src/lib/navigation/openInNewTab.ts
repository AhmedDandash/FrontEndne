import { message } from 'antd';
import { createTabReservation } from './tabReservation';

const POPUP_BLOCKED_MESSAGE = 'يرجى السماح بالنوافذ المنبثقة / Please allow pop-ups';

/** Synchronously open a tab, then point it at `url`. */
export function openInNewTab(url: string) {
  reserveNewTab().navigate(url);
}

/**
 * For async targets: reserves the tab *inside the click gesture*, then navigates
 * it once the URL is known. Calling window.open after an `await` gets blocked.
 */
export function reserveNewTab() {
  const reservation = createTabReservation(() => window.open('about:blank', '_blank'));
  if (!reservation.opened) message.warning(POPUP_BLOCKED_MESSAGE);
  return reservation;
}
