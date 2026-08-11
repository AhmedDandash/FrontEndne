import { test } from 'node:test';
import assert from 'node:assert/strict';

import { actionLinkProps, linkProps } from './linkProps.ts';

function createRouter() {
  const pushed: string[] = [];
  return {
    pushed,
    router: {
      push: (href: string) => {
        pushed.push(href);
      },
    },
  };
}

function createEvent(overrides: Partial<{
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}> = {}) {
  let prevented = false;
  return {
    event: {
      defaultPrevented: overrides.defaultPrevented ?? false,
      button: overrides.button ?? 0,
      metaKey: overrides.metaKey ?? false,
      ctrlKey: overrides.ctrlKey ?? false,
      shiftKey: overrides.shiftKey ?? false,
      altKey: overrides.altKey ?? false,
      preventDefault: () => {
        prevented = true;
      },
    },
    wasPrevented: () => prevented,
  };
}

test('plain left-click prevents default and calls router.push', () => {
  const { router, pushed } = createRouter();
  const props = linkProps('/target', router as never);
  const { event, wasPrevented } = createEvent();

  props.onClick(event as never);

  assert.equal(wasPrevented(), true);
  assert.deepEqual(pushed, ['/target']);
});

for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
  test(`${modifier} click lets the browser handle navigation`, () => {
    const { router, pushed } = createRouter();
    const props = linkProps('/target', router as never);
    const { event, wasPrevented } = createEvent({ [modifier]: true });

    props.onClick(event as never);

    assert.equal(wasPrevented(), false);
    assert.deepEqual(pushed, []);
  });
}

test('middle-click lets the browser handle navigation', () => {
  const { router, pushed } = createRouter();
  const props = linkProps('/target', router as never);
  const { event, wasPrevented } = createEvent({ button: 1 });

  props.onClick(event as never);

  assert.equal(wasPrevented(), false);
  assert.deepEqual(pushed, []);
});

test('actionLinkProps keeps plain left-click as a local action', () => {
  let calls = 0;
  const props = actionLinkProps('/target', () => { calls += 1; });
  const { event, wasPrevented } = createEvent();

  props.onClick(event as never);

  assert.equal(wasPrevented(), true);
  assert.equal(calls, 1);
});

for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
  test(`actionLinkProps lets the browser handle ${modifier} click`, () => {
    let calls = 0;
    const props = actionLinkProps('/target', () => { calls += 1; });
    const { event, wasPrevented } = createEvent({ [modifier]: true });

    props.onClick(event as never);

    assert.equal(wasPrevented(), false);
    assert.equal(calls, 0);
  });
}

test('actionLinkProps lets the browser handle middle-click', () => {
  let calls = 0;
  const props = actionLinkProps('/target', () => { calls += 1; });
  const { event, wasPrevented } = createEvent({ button: 1 });

  props.onClick(event as never);

  assert.equal(wasPrevented(), false);
  assert.equal(calls, 0);
});
