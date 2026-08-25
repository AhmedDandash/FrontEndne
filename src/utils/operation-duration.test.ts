import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatOperationDuration } from './operation-duration.ts';

test('formatOperationDuration maps operation-contract enum values when requested', () => {
  assert.equal(formatOperationDuration(1, 'ar', '1', { preferEnum: true }), 'شهري');
  assert.equal(formatOperationDuration(2, 'ar', '2', { preferEnum: true }), 'ربع سنوي');
  assert.equal(formatOperationDuration(3, 'ar', '3', { preferEnum: true }), 'نصف سنوي');
  assert.equal(formatOperationDuration(4, 'ar', '4', { preferEnum: true }), 'سنوي');
});

test('formatOperationDuration keeps month-based duration labels by default', () => {
  assert.equal(formatOperationDuration(3, 'ar'), 'ربع سنوي');
  assert.equal(formatOperationDuration(6, 'en'), 'Semi-annual');
  assert.equal(formatOperationDuration(12, 'ar'), 'سنوي');
});

test('formatOperationDuration ignores numeric fallback labels but keeps readable ones', () => {
  assert.equal(formatOperationDuration(4, 'en', '4'), 'Annual');
  assert.equal(formatOperationDuration(99, 'ar', 'مدة خاصة'), 'مدة خاصة');
});
