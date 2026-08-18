import { APP_PERMISSIONS } from './appPermissions.ts';
import { hasPermission } from './appPermissions.ts';
import {
  canAccessPage,
  isAdminRole,
  type PermissionMatrix,
} from './pagePermissions.config.ts';

export const ACCOUNTING_READ_PERMISSIONS = [
  APP_PERMISSIONS.ACCOUNTING_VIEW,
  APP_PERMISSIONS.ACCOUNTING_FULL_ACCESS,
] as const;

export const ACCOUNTING_MANAGE_PERMISSIONS = [
  APP_PERMISSIONS.ACCOUNTING_MANAGE,
  APP_PERMISSIONS.ACCOUNTING_FULL_ACCESS,
] as const;

export const HR_READ_PERMISSIONS = [
  APP_PERMISSIONS.HR_VIEW,
  APP_PERMISSIONS.HR_FULL_ACCESS,
] as const;

export const HR_MANAGE_PERMISSIONS = [
  APP_PERMISSIONS.HR_MANAGE,
  APP_PERMISSIONS.HR_FULL_ACCESS,
] as const;

export const ADMIN_MANAGE_PERMISSIONS = [
  APP_PERMISSIONS.ADMINISTRATION_MANAGE,
  APP_PERMISSIONS.SYSTEM_FULL_ACCESS,
] as const;

export const PAGE_PERMISSION_REQUIREMENTS: Record<string, readonly string[]> = {
  '/customers': [APP_PERMISSIONS.CUSTOMERS_VIEW],
  '/complaints': [APP_PERMISSIONS.CUSTOMERS_VIEW],
  '/sponsorship-transfer': [APP_PERMISSIONS.CONTRACTS_VIEW],

  '/applicants': [APP_PERMISSIONS.WORKERS_VIEW, APP_PERMISSIONS.WORKERS_OWN_VIEW],
  '/applicants/available': [APP_PERMISSIONS.WORKERS_VIEW, APP_PERMISSIONS.WORKERS_OWN_VIEW],
  '/housing/management': [APP_PERMISSIONS.WORKERS_VIEW, APP_PERMISSIONS.WORKERS_OWN_VIEW],
  '/housing/applicants': [APP_PERMISSIONS.WORKERS_VIEW, APP_PERMISSIONS.WORKERS_OWN_VIEW],

  '/contracts/mediationcontract': [APP_PERMISSIONS.CONTRACTS_VIEW],
  '/contracts/mediationcontract/automaticfollowup': [
    APP_PERMISSIONS.AUTOMATIC_FOLLOW_UP_VIEW,
    APP_PERMISSIONS.AUTOMATIC_FOLLOW_UP_STATUS_VIEW,
  ],
  '/contracts/mediationcontract/offers': [APP_PERMISSIONS.CONTRACTS_VIEW],
  '/contracts/mediationrequests': [APP_PERMISSIONS.CONTRACTS_VIEW],
  '/contracts/operation/rent': [APP_PERMISSIONS.CONTRACTS_VIEW],
  '/contracts/operation/collection-renewal': [APP_PERMISSIONS.CONTRACTS_VIEW],
  '/contracts/operation/rent-prices-offers': [APP_PERMISSIONS.CONTRACTS_VIEW],

  '/agents': [APP_PERMISSIONS.AGENTS_VIEW, APP_PERMISSIONS.AGENTS_OWN_DATA_VIEW],

  '/hr/employees': HR_READ_PERMISSIONS,
  '/hr/positions': HR_READ_PERMISSIONS,
  '/hr/departments': HR_READ_PERMISSIONS,
  '/hr/attendance': HR_READ_PERMISSIONS,
  '/hr/leave': HR_READ_PERMISSIONS,
  '/hr/leave-types': HR_READ_PERMISSIONS,
  '/hr/payroll': HR_READ_PERMISSIONS,
  '/hr/admin-users': ADMIN_MANAGE_PERMISSIONS,
  '/hr/permission-request': HR_READ_PERMISSIONS,
  '/hr/permission-requests': HR_READ_PERMISSIONS,
  '/hr/resignation-request': HR_READ_PERMISSIONS,
  '/hr/resignation-requests': HR_READ_PERMISSIONS,
  '/hr/custody-request': HR_READ_PERMISSIONS,
  '/hr/custody-requests': HR_READ_PERMISSIONS,

  '/accounting/journal-entries': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/chart-of-accounts': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/account-settings': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/restriction-types': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/general-vouchers': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/receipt-vouchers': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/payment-vouchers': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/credit-notes': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/debit-notes': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/period-closing': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/general-ledger': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/agent-ledger': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/customer-ledger': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/worker-ledger': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/trial-balance': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/income-statement': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/balance-sheet': ACCOUNTING_READ_PERMISSIONS,
  '/accounting/ledger/vat-report': ACCOUNTING_READ_PERMISSIONS,

  '/branch/management': ADMIN_MANAGE_PERMISSIONS,
  '/settings/mediation': ADMIN_MANAGE_PERMISSIONS,
  '/settings/marketer': ADMIN_MANAGE_PERMISSIONS,
  '/settings/custody-types': ADMIN_MANAGE_PERMISSIONS,
  '/register': ADMIN_MANAGE_PERMISSIONS,
  '/settings/permissions': ADMIN_MANAGE_PERMISSIONS,

  '/zatca': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/invoices': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/branch-setup': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/csr': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/certificates': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/settings': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/connection': ADMIN_MANAGE_PERMISSIONS,
  '/zatca/logs': ADMIN_MANAGE_PERMISSIONS,
};

export function getMissingPagePermissionDefaults(pageKeys: readonly string[]): string[] {
  return pageKeys.filter((key) => PAGE_PERMISSION_REQUIREMENTS[key] === undefined);
}

export function mergePermissionMatrixWithDefaults(
  defaults: PermissionMatrix,
  overrides: PermissionMatrix | null | undefined
): PermissionMatrix {
  return {
    ...defaults,
    ...(overrides ?? {}),
  };
}

export function canAccessPageWithPermissionRequirements(
  pageKey: string | null,
  roles: readonly string[],
  permissions: readonly string[],
  matrix: PermissionMatrix
): boolean {
  if (!pageKey) return true;
  if (isAdminRole([...roles])) return true;
  if (!canAccessPage(pageKey, [...roles], matrix)) return false;
  const requiredPermissions = PAGE_PERMISSION_REQUIREMENTS[pageKey];
  return !requiredPermissions || hasPermission(permissions, requiredPermissions);
}
