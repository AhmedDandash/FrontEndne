import { isAdminRole } from './pagePermissions.config.ts';

export const APP_PERMISSIONS = {
  CUSTOMERS_VIEW: 'Customers.View',
  CUSTOMERS_CREATE: 'Customers.Create',
  CUSTOMERS_UPDATE: 'Customers.Update',
  CUSTOMERS_DELETE: 'Customers.Delete',

  CONTRACTS_VIEW: 'Contracts.View',
  CONTRACTS_CREATE: 'Contracts.Create',
  CONTRACTS_UPDATE: 'Contracts.Update',
  CONTRACTS_DELETE: 'Contracts.Delete',
  CONTRACTS_APPROVE: 'Contracts.Approve',
  CONTRACTS_STATUS_VIEW: 'Contracts.Status.View',

  AUTOMATIC_FOLLOW_UP_VIEW: 'AutomaticFollowUp.View',
  AUTOMATIC_FOLLOW_UP_STATUS_VIEW: 'AutomaticFollowUp.Status.View',
  AUTOMATIC_FOLLOW_UP_MANAGE: 'AutomaticFollowUp.Manage',

  WORKERS_VIEW: 'Workers.View',
  WORKERS_CREATE: 'Workers.Create',
  WORKERS_UPDATE: 'Workers.Update',
  WORKERS_DELETE: 'Workers.Delete',
  WORKERS_OWN_VIEW: 'Workers.Own.View',
  WORKERS_OWN_CREATE: 'Workers.Own.Create',
  WORKERS_OWN_UPDATE: 'Workers.Own.Update',

  AGENTS_VIEW: 'Agents.View',
  AGENTS_CREATE: 'Agents.Create',
  AGENTS_UPDATE: 'Agents.Update',
  AGENTS_DELETE: 'Agents.Delete',
  AGENTS_OWN_DATA_VIEW: 'Agents.OwnData.View',
  AGENTS_OWN_DATA_CREATE: 'Agents.OwnData.Create',
  AGENTS_OWN_DATA_UPDATE: 'Agents.OwnData.Update',

  ACCOUNTING_FULL_ACCESS: 'Accounting.FullAccess',
  ACCOUNTING_VIEW: 'Accounting.View',
  ACCOUNTING_MANAGE: 'Accounting.Manage',
  HR_FULL_ACCESS: 'HR.FullAccess',
  HR_VIEW: 'HR.View',
  HR_MANAGE: 'HR.Manage',
  ADMINISTRATION_MANAGE: 'Administration.Manage',
  SYSTEM_FULL_ACCESS: 'System.FullAccess',
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

export interface AccessPermissionClaims {
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
}

export type PermissionSubject =
  | readonly string[]
  | AccessPermissionClaims
  | null
  | undefined;

function isPermissionArray(subject: PermissionSubject): subject is readonly string[] {
  return Array.isArray(subject);
}

export function hasPermission(
  userPermissions: readonly string[] | null | undefined,
  required: string | readonly string[]
): boolean {
  if (!userPermissions?.length) return false;
  const set = new Set(userPermissions.map((p) => p.toLowerCase()));
  if (set.has(APP_PERMISSIONS.SYSTEM_FULL_ACCESS.toLowerCase())) return true;

  const needed = Array.isArray(required) ? required : [required];
  return needed.some((permission) => set.has(permission.toLowerCase()));
}

export function hasFullAccessIdentity(subject: PermissionSubject): boolean {
  const roles = isPermissionArray(subject) ? [] : subject?.roles ?? [];
  const permissions = isPermissionArray(subject) ? subject : subject?.permissions;
  return isAdminRole([...roles]) || hasPermission(permissions, APP_PERMISSIONS.SYSTEM_FULL_ACCESS);
}

export function hasAccessPermission(
  subject: PermissionSubject,
  required: string | readonly string[]
): boolean {
  if (hasFullAccessIdentity(subject)) return true;
  const permissions = isPermissionArray(subject) ? subject : subject?.permissions;
  return hasPermission(permissions, required);
}
