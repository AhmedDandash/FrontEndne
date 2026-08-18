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
  PAGE_REGISTRY,
  resolvePageKey,
  isAdminRole,
  canAccessPage,
  isPageConfigured,
  DEFAULT_RESTRICTED_PAGES,
  type PermissionMatrix,
} from '../config/pagePermissions.config.ts';
import { DEFAULT_ROLE_PAGE_MATRIX } from '../config/defaultRolePageMatrix.ts';

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
  assert.equal(isAdminRole(['owner']), true);
  assert.equal(isAdminRole(['SuperAdmin']), true);
  assert.equal(isAdminRole(['HR', 'Employee']), false);
  assert.equal(isAdminRole([]), false);
});

// ── canAccessPage ───────────────────────────────────────────────────────────
test('canAccessPage: admins always pass, even on a restricted page', () => {
  const matrix: PermissionMatrix = { '/hr/payroll': [] };
  assert.equal(canAccessPage('/hr/payroll', ['Admin'], matrix), true);
});

test('canAccessPage: configured default page denies a non-listed role', () => {
  assert.equal(canAccessPage('/hr/payroll', ['Employee'], DEFAULT_ROLE_PAGE_MATRIX), false);
});

test('canAccessPage: missing matrix entry is denied by default', () => {
  assert.equal(canAccessPage('/hr/payroll', ['HREmployee'], {}), false);
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

// ── DEFAULT_RESTRICTED_PAGES / isPageConfigured ────────────────────────────
// Regression coverage for a bug caught in the 2026-08 Auth-module audit:
// canAccessPage's fallback to DEFAULT_RESTRICTED_PAGES was correct in
// isolation, but usePagePermissions.ts's `check()` had its own earlier
// "matrix[key] === undefined → allow" guard that returned before
// canAccessPage ever ran, so a non-admin could still reach /register (Add
// Admin) with a completely unconfigured (fresh-install) permission matrix.
// isPageConfigured() is the single source of truth both `check()` and these
// tests use for that guard, so they can't drift apart again.
test('DEFAULT_RESTRICTED_PAGES: /register is admin-only by default', () => {
  assert.deepEqual(DEFAULT_RESTRICTED_PAGES['/register'], []);
});

test('isPageConfigured: a page with a default restriction counts as configured even with an empty matrix', () => {
  assert.equal(isPageConfigured('/register', {}), true);
});

test('isPageConfigured: a page from the default role matrix counts as configured', () => {
  assert.equal(isPageConfigured('/hr/payroll', DEFAULT_ROLE_PAGE_MATRIX), true);
});

test('isPageConfigured: an explicit matrix entry overrides having no default', () => {
  assert.equal(isPageConfigured('/hr/payroll', { '/hr/payroll': ['HR'] }), true);
});

test('canAccessPage: /register with an unconfigured (empty) matrix denies non-admins', () => {
  assert.equal(canAccessPage('/register', ['Employee'], {}), false);
  assert.equal(canAccessPage('/register', [], {}), false);
});

test('canAccessPage: /register with an unconfigured (empty) matrix still allows admins', () => {
  assert.equal(canAccessPage('/register', ['Admin'], {}), true);
});

test('canAccessPage: an admin explicitly widening /register access via the matrix still works', () => {
  const matrix: PermissionMatrix = { '/register': ['HR'] };
  assert.equal(canAccessPage('/register', ['HR'], matrix), true);
  assert.equal(canAccessPage('/register', ['Employee'], matrix), false);
});

test('DEFAULT_ROLE_PAGE_MATRIX: every registered page has a default entry', () => {
  const missing = PAGE_REGISTRY
    .map((page) => page.key)
    .filter((key) => DEFAULT_ROLE_PAGE_MATRIX[key] === undefined);

  assert.deepEqual(missing, []);
});
