import { test } from 'node:test';
import assert from 'node:assert/strict';

import { APP_PERMISSIONS, hasAccessPermission, hasPermission } from '../config/appPermissions.ts';
import {
  isCurrentAccessClaimsReady,
  resolveCurrentAccessClaims,
  resolveMeClaimsState,
} from '../config/accessClaims.ts';
import { getAttendanceAccessGates } from '../config/attendanceAccess.ts';
import { PAGE_REGISTRY } from '../config/pagePermissions.config.ts';
import { DEFAULT_ROLE_PAGE_MATRIX } from '../config/defaultRolePageMatrix.ts';
import {
  canAccessPageWithPermissionRequirements,
  getMissingPagePermissionDefaults,
  mergePermissionMatrixWithDefaults,
} from '../config/pagePermissionRequirements.ts';
import { resolveAgentDetailAccess } from '../config/agentAccess.ts';
import {
  getAccountingActionGates,
  getContractActionGates,
  getHrActionGates,
} from '../config/actionPermissionGates.ts';
import { AUTH_TOKEN_REFRESHED_EVENT, subscribeToAuthTokenRefresh } from '../config/authMeQuery.ts';
import {
  DASHBOARD_QUICK_LINKS,
  filterDashboardQuickLinksByAccess,
} from '../config/dashboardQuickLinks.ts';

test('hasPermission: matches case-insensitively and honors System.FullAccess', () => {
  assert.equal(hasPermission(['customers.create'], APP_PERMISSIONS.CUSTOMERS_CREATE), true);
  assert.equal(hasPermission(['Workers.View'], APP_PERMISSIONS.CUSTOMERS_CREATE), false);
  assert.equal(hasPermission(['System.FullAccess'], APP_PERMISSIONS.ADMINISTRATION_MANAGE), true);
});

test('action gates: contract actions map to exact Contracts permissions', () => {
  assert.deepEqual(getContractActionGates([APP_PERMISSIONS.CONTRACTS_VIEW]), {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canSign: false,
    canCancel: false,
  });

  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_CREATE]).canCreate, true);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_UPDATE]).canUpdate, true);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_DELETE]).canDelete, true);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_DELETE]).canCancel, true);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_APPROVE]).canApprove, true);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_APPROVE]).canSign, true);
});

test('action gates: accounting and HR read-only permissions cannot mutate', () => {
  assert.equal(getAccountingActionGates([APP_PERMISSIONS.ACCOUNTING_VIEW]).canManage, false);
  assert.equal(getAccountingActionGates([APP_PERMISSIONS.ACCOUNTING_MANAGE]).canManage, true);
  assert.equal(getAccountingActionGates([APP_PERMISSIONS.ACCOUNTING_FULL_ACCESS]).canCreate, true);

  assert.equal(getHrActionGates([APP_PERMISSIONS.HR_VIEW]).canManage, false);
  assert.equal(getHrActionGates([APP_PERMISSIONS.HR_MANAGE]).canApprove, true);
  assert.equal(getHrActionGates([APP_PERMISSIONS.HR_FULL_ACCESS]).canResetPassword, true);
});

test('action gates: System.FullAccess satisfies all action gates', () => {
  const permissions = [APP_PERMISSIONS.SYSTEM_FULL_ACCESS];
  assert.equal(Object.values(getContractActionGates(permissions)).every(Boolean), true);
  assert.equal(Object.values(getAccountingActionGates(permissions)).every(Boolean), true);
  assert.equal(Object.values(getHrActionGates(permissions)).every(Boolean), true);
});

test('action gates: Admin and Owner can mutate with empty permission arrays', () => {
  for (const role of ['Admin', 'Owner']) {
    const subject = { roles: [role], permissions: [] };

    assert.equal(hasAccessPermission(subject, APP_PERMISSIONS.CONTRACTS_CREATE), true);
    assert.equal(Object.values(getContractActionGates(subject)).every(Boolean), true);
    assert.equal(Object.values(getAccountingActionGates(subject)).every(Boolean), true);
    assert.equal(Object.values(getHrActionGates(subject)).every(Boolean), true);
  }
});

test('action gates: non-admin users still require exact action permissions', () => {
  const subject = { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] };

  assert.equal(hasAccessPermission(subject, APP_PERMISSIONS.HR_MANAGE), false);
  assert.equal(getHrActionGates(subject).canManage, false);
  assert.equal(getAccountingActionGates(subject).canCreate, false);
  assert.equal(getContractActionGates(subject).canCreate, false);
  assert.equal(
    getContractActionGates({
      roles: ['SalesEmployee'],
      permissions: [APP_PERMISSIONS.CONTRACTS_CREATE],
    }).canCreate,
    true
  );
});

test('token refresh event causes /me claims to refetch', () => {
  const globalWithWindow = globalThis as unknown as { window?: EventTarget };
  const previousWindow = globalWithWindow.window;
  const eventTarget = new EventTarget();
  globalWithWindow.window = eventTarget;

  let refetchCount = 0;
  const unsubscribe = subscribeToAuthTokenRefresh(() => {
    refetchCount += 1;
  });

  eventTarget.dispatchEvent(new Event(AUTH_TOKEN_REFRESHED_EVENT));
  assert.equal(refetchCount, 1);

  unsubscribe();
  eventTarget.dispatchEvent(new Event(AUTH_TOKEN_REFRESHED_EVENT));
  assert.equal(refetchCount, 1);

  globalWithWindow.window = previousWindow;
});

test('read-only users cannot access representative nested mutation controls', () => {
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_VIEW]).canUpdate, false);
  assert.equal(getContractActionGates([APP_PERMISSIONS.CONTRACTS_VIEW]).canApprove, false);
  assert.equal(getAccountingActionGates([APP_PERMISSIONS.ACCOUNTING_VIEW]).canPost, false);
  assert.equal(getAccountingActionGates([APP_PERMISSIONS.ACCOUNTING_VIEW]).canDelete, false);
  assert.equal(getHrActionGates([APP_PERMISSIONS.HR_VIEW]).canReject, false);
  assert.equal(getHrActionGates([APP_PERMISSIONS.HR_VIEW]).canResetPassword, false);
});

test('/me success: empty arrays override JWT fallback claims', () => {
  const claims = resolveCurrentAccessClaims(
    'success',
    { roles: [], permissions: [] },
    { roles: ['Admin'], permissions: ['System.FullAccess'] }
  );

  assert.deepEqual(claims, { roles: [], permissions: [] });
});

test('attendance gates: dashboard employees get self-service controls without report access', () => {
  const gates = getAttendanceAccessGates({ roles: ['Employee'], permissions: [] });

  assert.equal(gates.canUseSelfService, true);
  assert.equal(gates.canUseMutationControls, true);
  assert.equal(gates.canFilterRecords, false);
});

test('attendance gates: HR read-only users can filter reports but cannot self check in', () => {
  const gates = getAttendanceAccessGates({
    roles: ['HREmployee'],
    permissions: [APP_PERMISSIONS.HR_VIEW],
  });

  assert.equal(gates.canFilterRecords, true);
  assert.equal(gates.canUseSelfService, false);
  assert.equal(gates.canUseMutationControls, false);
});

test('attendance gates: non-HR employees cannot issue the Filter report request', () => {
  const gates = getAttendanceAccessGates({
    roles: ['Employee'],
    permissions: [APP_PERMISSIONS.CUSTOMERS_VIEW],
  });

  assert.equal(gates.canFilterRecords, false);
  assert.equal(gates.canUseMutationControls, true);
});

test('attendance gates: Admin and System.FullAccess can read attendance reports', () => {
  assert.equal(
    getAttendanceAccessGates({ roles: ['Admin'], permissions: [] }).canFilterRecords,
    true
  );
  assert.equal(
    getAttendanceAccessGates({
      roles: ['Support'],
      permissions: [APP_PERMISSIONS.SYSTEM_FULL_ACCESS],
    }).canFilterRecords,
    true
  );

  assert.equal(
    getAttendanceAccessGates({ roles: ['Admin'], permissions: [] }).canUseMutationControls,
    false
  );
});

test('/me pending: JWT fallback becomes ready only after the bounded pending period', () => {
  assert.equal(isCurrentAccessClaimsReady('pending', true, false), false);
  assert.equal(isCurrentAccessClaimsReady('pending', true, true), true);

  const claims = resolveCurrentAccessClaims(
    'pending',
    undefined,
    { roles: ['Admin'], permissions: [APP_PERMISSIONS.SYSTEM_FULL_ACCESS] }
  );

  assert.deepEqual(claims, {
    roles: ['Admin'],
    permissions: [APP_PERMISSIONS.SYSTEM_FULL_ACCESS],
  });
});

test('/me failure: JWT fallback claims are used', () => {
  const claims = resolveCurrentAccessClaims(
    'error',
    undefined,
    { roles: ['Agent'], permissions: ['Agents.OwnData.View'] }
  );

  assert.deepEqual(claims, {
    roles: ['Agent'],
    permissions: ['Agents.OwnData.View'],
  });
});

test('token refresh: cached successful /me data enters pending state for the new token', () => {
  const claimsState = resolveMeClaimsState({
    isAuthenticated: true,
    queryState: 'success',
    tokenRefreshState: 'pending',
  });

  assert.equal(claimsState, 'pending');
  assert.equal(isCurrentAccessClaimsReady(claimsState, true, false), false);
  assert.deepEqual(
    resolveCurrentAccessClaims(
      claimsState,
      { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] },
      { roles: ['Employee'], permissions: [] }
    ),
    { roles: ['Employee'], permissions: [] }
  );
});

test('token refresh: slow /me uses new JWT claims after the bounded grace period', () => {
  const claimsState = resolveMeClaimsState({
    isAuthenticated: true,
    queryState: 'success',
    tokenRefreshState: 'pending',
  });

  assert.equal(isCurrentAccessClaimsReady(claimsState, true, true), true);
  assert.deepEqual(
    resolveCurrentAccessClaims(
      claimsState,
      { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] },
      {
        roles: ['SalesEmployee'],
        permissions: [APP_PERMISSIONS.CUSTOMERS_VIEW],
      }
    ),
    {
      roles: ['SalesEmployee'],
      permissions: [APP_PERMISSIONS.CUSTOMERS_VIEW],
    }
  );
});

test('token refresh: failed post-refresh /me keeps using the new JWT fallback claims', () => {
  const claimsState = resolveMeClaimsState({
    isAuthenticated: true,
    queryState: 'success',
    tokenRefreshState: 'error',
  });

  assert.equal(claimsState, 'error');
  assert.deepEqual(
    resolveCurrentAccessClaims(
      claimsState,
      { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] },
      { roles: ['Employee'], permissions: [] }
    ),
    { roles: ['Employee'], permissions: [] }
  );
});

test('token refresh: successful post-refresh /me is authoritative, including empty arrays', () => {
  const claimsState = resolveMeClaimsState({
    isAuthenticated: true,
    queryState: 'success',
    tokenRefreshState: 'idle',
  });

  assert.deepEqual(
    resolveCurrentAccessClaims(
      claimsState,
      { roles: [], permissions: [] },
      { roles: ['Admin'], permissions: [APP_PERMISSIONS.SYSTEM_FULL_ACCESS] }
    ),
    { roles: [], permissions: [] }
  );
});

test('sidebar access follows effective claims after token refresh fallback changes', () => {
  const staleClaims = resolveCurrentAccessClaims(
    'success',
    { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] },
    { roles: ['SalesEmployee'], permissions: [APP_PERMISSIONS.CUSTOMERS_VIEW] }
  );
  const refreshedClaims = resolveCurrentAccessClaims(
    'pending',
    { roles: ['HREmployee'], permissions: [APP_PERMISSIONS.HR_VIEW] },
    { roles: ['SalesEmployee'], permissions: [APP_PERMISSIONS.CUSTOMERS_VIEW] }
  );

  assert.equal(
    canAccessPageWithPermissionRequirements(
      '/customers',
      staleClaims.roles,
      staleClaims.permissions,
      DEFAULT_ROLE_PAGE_MATRIX
    ),
    false
  );
  assert.equal(
    canAccessPageWithPermissionRequirements(
      '/customers',
      refreshedClaims.roles,
      refreshedClaims.permissions,
      DEFAULT_ROLE_PAGE_MATRIX
    ),
    true
  );
  assert.equal(
    canAccessPageWithPermissionRequirements(
      '/hr/attendance',
      refreshedClaims.roles,
      refreshedClaims.permissions,
      DEFAULT_ROLE_PAGE_MATRIX
    ),
    false
  );
});

test('DEFAULT_ROLE_PAGE_MATRIX: every PAGE_REGISTRY entry has a default', () => {
  const missing = PAGE_REGISTRY
    .map((page) => page.key)
    .filter((key) => DEFAULT_ROLE_PAGE_MATRIX[key] === undefined);

  assert.deepEqual(missing, []);
});

test('PAGE_PERMISSION_REQUIREMENTS: every non-hourly registered page has a read default', () => {
  const nonHourlyKeys = PAGE_REGISTRY
    .map((page) => page.key)
    .filter((key) => !key.startsWith('/hourly-workers') && key !== '/dashboard');

  assert.deepEqual(getMissingPagePermissionDefaults(nonHourlyKeys), []);
});

test('agent detail access: own-only users cannot open arbitrary agent ids', () => {
  assert.equal(
    resolveAgentDetailAccess({
      requestedId: 'agent-2',
      ownAgentId: 'agent-1',
      canViewAll: false,
      canViewOwn: true,
      isReady: true,
      isLoading: false,
    }),
    'denied'
  );

  assert.equal(
    resolveAgentDetailAccess({
      requestedId: 'agent-1',
      ownAgentId: 'agent-1',
      canViewAll: false,
      canViewOwn: true,
      isReady: true,
      isLoading: false,
    }),
    'own'
  );

  assert.equal(
    resolveAgentDetailAccess({
      requestedId: 'anything',
      ownAgentId: null,
      canViewAll: false,
      canViewOwn: true,
      isReady: true,
      isLoading: false,
    }),
    'unlinked'
  );
});

test('page visibility: role alone is not enough when the page requires permissions', () => {
  assert.equal(
    canAccessPageWithPermissionRequirements(
      '/customers',
      ['SalesEmployee'],
      [],
      DEFAULT_ROLE_PAGE_MATRIX
    ),
    false
  );

  assert.equal(
    canAccessPageWithPermissionRequirements(
      '/customers',
      ['SalesEmployee'],
      [APP_PERMISSIONS.CUSTOMERS_VIEW],
      DEFAULT_ROLE_PAGE_MATRIX
    ),
    true
  );
});

test('dashboard quick links: route access filters denied and pending modules', () => {
  const visible = filterDashboardQuickLinksByAccess(DASHBOARD_QUICK_LINKS, (path) => {
    if (path === '/customers') return 'allow';
    if (path === '/complaints') return 'pending';
    return 'deny';
  });

  assert.deepEqual(
    visible.map((link) => link.path),
    ['/customers']
  );
});

test('page visibility: Admin and Owner pass even with empty permissions', () => {
  assert.equal(
    canAccessPageWithPermissionRequirements('/customers', ['Admin'], [], DEFAULT_ROLE_PAGE_MATRIX),
    true
  );
  assert.equal(
    canAccessPageWithPermissionRequirements('/accounting/journal-entries', ['Owner'], [], DEFAULT_ROLE_PAGE_MATRIX),
    true
  );
});

test('page permission override persistence: saved overrides merge over defaults', () => {
  const merged = mergePermissionMatrixWithDefaults(DEFAULT_ROLE_PAGE_MATRIX, {
    '/customers': ['FollowUpEmployee'],
    '/register': [],
  });

  assert.deepEqual(merged['/customers'], ['FollowUpEmployee']);
  assert.deepEqual(merged['/dashboard'], DEFAULT_ROLE_PAGE_MATRIX['/dashboard']);
  assert.deepEqual(merged['/register'], []);
});
