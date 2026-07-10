/**
 * Phase 4 — unit tests for the pure logic added/refactored in the Operations module.
 * Run with Node's built-in test runner (Node 24 strips TS types natively):
 *   node --test src/__tests__/operations-logic.test.ts
 *
 * These cover the request/response-mapping and error-handling helpers that the
 * whole module depends on. UI + live-API flows require a backend (see report).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { unwrap, unwrapList } from '../utils/api-response.ts';
import { getApiErrorMessage } from '../utils/api-error.ts';
import { toReceiptSections } from '../app/contracts/operation/rent/_components/print-receipt.ts';

// ──────────────────────────────────────────────────────────────────────────
// unwrap — envelope peeling
// ──────────────────────────────────────────────────────────────────────────
test('unwrap: returns a plain object unchanged', () => {
  assert.deepEqual(unwrap({ id: 1, name: 'x' }), { id: 1, name: 'x' });
});

test('unwrap: peels { data }', () => {
  assert.deepEqual(unwrap({ success: true, data: { id: 7 } }), { id: 7 });
});

test('unwrap: peels { data: { value } } (System.Text.Json)', () => {
  assert.deepEqual(unwrap({ data: { value: { id: 9 } } }), { id: 9 });
});

test('unwrap: peels top-level { value }', () => {
  assert.equal(unwrap({ value: 42 }), 42);
});

// ──────────────────────────────────────────────────────────────────────────
// unwrapList — every known list shape → array (never throws)
// ──────────────────────────────────────────────────────────────────────────
test('unwrapList: flat array', () => {
  assert.deepEqual(unwrapList([1, 2, 3]), [1, 2, 3]);
});

test('unwrapList: { data: [...] }', () => {
  assert.deepEqual(unwrapList({ data: [1, 2] }), [1, 2]);
});

test('unwrapList: { data: { items: [...] } } (confirmed contract shape)', () => {
  assert.deepEqual(unwrapList({ success: true, data: { items: [{ id: 1 }] } }), [{ id: 1 }]);
});

test('unwrapList: { items: [...] }', () => {
  assert.deepEqual(unwrapList({ items: ['a'] }), ['a']);
});

test('unwrapList: { result: [...] }', () => {
  assert.deepEqual(unwrapList({ result: ['r'] }), ['r']);
});

test('unwrapList: { $values: [...] }', () => {
  assert.deepEqual(unwrapList({ $values: [1] }), [1]);
});

test('unwrapList: { data: { $values: [...] } }', () => {
  assert.deepEqual(unwrapList({ data: { $values: [5] } }), [5]);
});

test('unwrapList: null / undefined / non-list → []', () => {
  assert.deepEqual(unwrapList(null), []);
  assert.deepEqual(unwrapList(undefined), []);
  assert.deepEqual(unwrapList({ foo: 'bar' }), []);
});

// ──────────────────────────────────────────────────────────────────────────
// getApiErrorMessage — server validation surfacing
// ──────────────────────────────────────────────────────────────────────────
test('getApiErrorMessage: joins errors[]', () => {
  const err = { response: { data: { errors: ['a is required', 'b too long'] } } };
  assert.equal(getApiErrorMessage(err, 'fb'), 'a is required • b too long');
});

test('getApiErrorMessage: falls back to message', () => {
  const err = { response: { data: { message: 'Conflict' } } };
  assert.equal(getApiErrorMessage(err, 'fb'), 'Conflict');
});

test('getApiErrorMessage: falls back to title', () => {
  const err = { response: { data: { title: 'Bad Request' } } };
  assert.equal(getApiErrorMessage(err, 'fb'), 'Bad Request');
});

test('getApiErrorMessage: empty errors[] ignored, uses fallback', () => {
  const err = { response: { data: { errors: [] } } };
  assert.equal(getApiErrorMessage(err, 'fallback msg'), 'fallback msg');
});

test('getApiErrorMessage: network error (no response) → fallback', () => {
  assert.equal(getApiErrorMessage(new Error('Network Error'), 'fallback msg'), 'fallback msg');
});

// ──────────────────────────────────────────────────────────────────────────
// toReceiptSections — print payload projection
// ──────────────────────────────────────────────────────────────────────────
test('toReceiptSections: null payload → []', () => {
  assert.deepEqual(toReceiptSections(null, false), []);
});

test('toReceiptSections: projects the contract + display into labelled sections', () => {
  const sections = toReceiptSections(
    {
      contract: {
        contractNumber: 55,
        paymentMethod: 1, // → Cash
        customerAddress: 'Riyadh',
        workerNameEn: 'Raju',
        cost: 1500,
        contractStartDate: '2026-01-01T00:00:00',
        contractEndDate: null,
      },
      display: { customerName: 'Sara', customerPhone: '050', nationalityName: 'India', jobName: 'Maid' },
    } as any,
    false
  );

  // All five sections carry at least one real value here.
  const titles = sections.map((s) => s.title);
  assert.deepEqual(titles, ['Contract', 'Customer', 'Worker', 'Pricing', 'Contract Period']);

  const contract = sections.find((s) => s.title === 'Contract')!;
  assert.equal(contract.rows.find((r) => r.label === 'Contract No.')!.value, '55');
  assert.equal(contract.rows.find((r) => r.label === 'Payment Method')!.value, 'Cash'); // enum → label

  const customer = sections.find((s) => s.title === 'Customer')!;
  assert.equal(customer.rows.find((r) => r.label === 'Name')!.value, 'Sara');

  const period = sections.find((s) => s.title === 'Contract Period')!;
  assert.equal(period.rows.find((r) => r.label === 'End Date')!.value, '—'); // null date → —
  // ISO start date is formatted to a locale date (not the raw ISO string)
  assert.notEqual(period.rows.find((r) => r.label === 'Start Date')!.value, '2026-01-01T00:00:00');
});

test('toReceiptSections: fully empty payload → no sections (all rows are dashes)', () => {
  const sections = toReceiptSections({ contract: {}, display: {} } as any, false);
  // Every row would be '—', so every section is filtered out.
  assert.deepEqual(sections, []);
});

test('toReceiptSections: Arabic titles when isRtl', () => {
  // Only the pricing figure is set → only the pricing section survives the dash filter.
  const sections = toReceiptSections({ contract: { cost: 1 }, display: {} } as any, true);
  assert.equal(sections[0].title, 'تفاصيل التسعير');
});
