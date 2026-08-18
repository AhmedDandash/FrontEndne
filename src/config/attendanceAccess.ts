import {
  hasAccessPermission,
  type PermissionSubject,
} from './appPermissions.ts';
import { HR_READ_PERMISSIONS } from './pagePermissionRequirements.ts';

export const ATTENDANCE_SELF_SERVICE_ROLES = ['Employee'] as const;

function isPermissionArray(subject: PermissionSubject): subject is readonly string[] {
  return Array.isArray(subject);
}

function getSubjectRoles(subject: PermissionSubject): readonly string[] {
  return isPermissionArray(subject) ? [] : subject?.roles ?? [];
}

function hasRole(subject: PermissionSubject, expectedRoles: readonly string[]): boolean {
  const roles = getSubjectRoles(subject).map((role) => role.toLowerCase());
  return expectedRoles.some((role) => roles.includes(role.toLowerCase()));
}

export function canFilterAttendanceRecords(subject: PermissionSubject): boolean {
  return hasAccessPermission(subject, HR_READ_PERMISSIONS);
}

export function canUseAttendanceSelfService(subject: PermissionSubject): boolean {
  return hasRole(subject, ATTENDANCE_SELF_SERVICE_ROLES);
}

export function getAttendanceAccessGates(subject: PermissionSubject) {
  const canSelfService = canUseAttendanceSelfService(subject);
  return {
    canFilterRecords: canFilterAttendanceRecords(subject),
    canUseSelfService: canSelfService,
    canUseMutationControls: canSelfService,
  };
}
