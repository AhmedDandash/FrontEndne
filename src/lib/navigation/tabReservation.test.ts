import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTabReservation } from './tabReservation.ts';

test('reserves a tab, detaches its opener, and navigates it', () => {
  const navigated: string[] = [];
  let closed = false;
  const popup = {
    opener: {},
    location: {
      replace: (url: string) => {
        assert.equal(popup.opener, null);
        navigated.push(url);
      },
    },
    close: () => {
      closed = true;
    },
  };

  const reservation = createTabReservation(() => popup);
  reservation.navigate('/target');
  reservation.close();

  assert.equal(reservation.opened, true);
  assert.equal(popup.opener, null);
  assert.deepEqual(navigated, ['/target']);
  assert.equal(closed, true);
});

test('blocked popup returns a safe no-op reservation', () => {
  const reservation = createTabReservation(() => null);

  assert.equal(reservation.opened, false);
  assert.doesNotThrow(() => reservation.navigate('/target'));
  assert.doesNotThrow(() => reservation.close());
});
