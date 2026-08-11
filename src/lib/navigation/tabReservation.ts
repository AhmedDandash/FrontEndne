export interface TabReservation {
  opened: boolean;
  navigate: (url: string) => void;
  close: () => void;
}

interface ReservableWindow {
  opener: unknown;
  location: { replace: (url: string) => void };
  close: () => void;
}

export function createTabReservation(openWindow: () => ReservableWindow | null): TabReservation {
  const reservedWindow = openWindow();

  if (reservedWindow) {
    // The initial document is a same-origin about:blank, so detach it before navigation.
    reservedWindow.opener = null;
  }

  return {
    opened: reservedWindow !== null,
    navigate: (url: string) => reservedWindow?.location.replace(url),
    close: () => reservedWindow?.close(),
  };
}
