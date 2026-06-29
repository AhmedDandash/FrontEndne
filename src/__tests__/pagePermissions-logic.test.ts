/**
 * Unit tests for the pure page-permission logic (the core of the Permissions
 * feature). Run with Node's built-in test runner (strips TS types natively):
 *   node --test src/__tests__/pagePermissions-logic.test.ts
 *
 * The UI + role enforcement wire these helpers into React; the brains live here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolvePageKey,
  isAdminRole,
  canAccessPage,
  type PermissionMatrix,
} from '../config/pagePermissions.config.ts';

// ── resolvePageKey ──────────────────────────────────────────────────────────
test('resolvePageKey: exact match', () => {
  assert.equal(resolvePageKey('/hr/employees'), '/hr/employees');
});

test('resolvePageKey: sub-route maps to its page (longest prefix)', () => {
  assert.equal(resolvePageKey('/hr/employees/123'), '/hr/employees');
});

test('resolvePageKey: prefers the most specific registered key', () => {
  // both /contracts/mediationcontract and .../offers are registered
  assert.equal(
    resolvePageKey('/contracts/mediationcontract/offers'),
    '/contracts/mediationcontract/offers'
  );
});

test('resolvePageKey: unknown path → null (treated as open)', () => {
  assert.equal(resolvePageKey('/totally/unknown'), null);
});

// ── isAdminRole ─────────────────────────────────────────────────────────────
test('isAdminRole: matches Admin case-insensitively', () => {
  assert.equal(isAdminRole(['admin']), true);
  assert.equal(isAdminRole(['SuperAdmin']), true);
  assert.equal(isAdminRole(['HR', 'Employee']), false);
  assert.equal(isAdminRole([]), false);
});

// ── canAccessPage ───────────────────────────────────────────────────────────
test('canAccessPage: admins always pass, even on a restricted page', () => {
  const matrix: PermissionMatrix = { '/hr/payroll': [] };
  assert.equal(canAccessPage('/hr/payroll', ['Admin'], matrix), true);
});

test('canAccessPage: unconfigured page is open to everyone', () => {
  assert.equal(canAccessPage('/hr/payroll', ['Employee'], {}), true);
});

test('canAccessPage: restricted page allows a listed role', () => {
  const matrix: PermissionMatrix = { '/hr/payroll': ['HR'] };
  assert.equal(canAccessPage('/hr/payroll', ['HR'], matrix), true);
});

test('canAccessPage: restricted page denies a non-listed role', () => {
  const matrix: PermissionMatrix = { '/hr/payroll': ['HR'] };
  assert.equal(canAccessPage('/hr/payroll', ['Employee'], matrix), false);
});

test('canAccessPage: empty allow-list locks out everyone but admins', () => {
  const matrix: PermissionMatrix = { '/hr/payroll': [] };
  assert.equal(canAccessPage('/hr/payroll', ['HR'], matrix), false);
  assert.equal(canAccessPage('/hr/payroll', ['Admin'], matrix), true);
});

test('canAccessPage: null page key (no registered page) is open', () => {
  assert.equal(canAccessPage(null, [], {}), true);
});
