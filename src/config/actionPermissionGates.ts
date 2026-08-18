import {
  APP_PERMISSIONS,
  hasAccessPermission,
  type PermissionSubject,
} from './appPermissions.ts';
import {
  ACCOUNTING_MANAGE_PERMISSIONS,
  HR_MANAGE_PERMISSIONS,
} from './pagePermissionRequirements.ts';

export const CONTRACT_ACTION_PERMISSIONS = {
  create: [APP_PERMISSIONS.CONTRACTS_CREATE],
  update: [APP_PERMISSIONS.CONTRACTS_UPDATE],
  delete: [APP_PERMISSIONS.CONTRACTS_DELETE],
  approve: [APP_PERMISSIONS.CONTRACTS_APPROVE],
} as const;

export function getContractActionGates(userAccess: PermissionSubject) {
  return {
    canCreate: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.create),
    canUpdate: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.update),
    canDelete: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.delete),
    canApprove: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.approve),
    canSign: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.approve),
    canCancel: hasAccessPermission(userAccess, CONTRACT_ACTION_PERMISSIONS.delete),
  };
}

export function getAccountingActionGates(userAccess: PermissionSubject) {
  const canManage = hasAccessPermission(userAccess, ACCOUNTING_MANAGE_PERMISSIONS);
  return {
    canCreate: canManage,
    canUpdate: canManage,
    canDelete: canManage,
    canPost: canManage,
    canUnpost: canManage,
    canClose: canManage,
    canOpen: canManage,
    canManage,
  };
}

export function getHrActionGates(userAccess: PermissionSubject) {
  const canManage = hasAccessPermission(userAccess, HR_MANAGE_PERMISSIONS);
  return {
    canCreate: canManage,
    canUpdate: canManage,
    canDelete: canManage,
    canApprove: canManage,
    canReject: canManage,
    canClose: canManage,
    canResetPassword: canManage,
    canManage,
  };
}
