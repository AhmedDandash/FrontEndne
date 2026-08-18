'use client';

import {
  getAccountingActionGates,
  getContractActionGates,
  getHrActionGates,
} from '@/config/actionPermissionGates';
import { getAttendanceAccessGates as getAttendanceAccessGatesFromClaims } from '@/config/attendanceAccess';
import { useHasPermission } from '@/hooks/api/usePagePermissions';

export function useAccountingActionGates() {
  const { roles, permissions, isReady } = useHasPermission();
  return { ...getAccountingActionGates({ roles, permissions }), isReady };
}

export function useHrActionGates() {
  const { roles, permissions, isReady } = useHasPermission();
  return { ...getHrActionGates({ roles, permissions }), isReady };
}

export function useAttendanceAccessGates() {
  const { roles, permissions, isReady } = useHasPermission();
  return { ...getAttendanceAccessGatesFromClaims({ roles, permissions }), isReady };
}

export function useContractActionGates() {
  const { roles, permissions, isReady } = useHasPermission();
  return { ...getContractActionGates({ roles, permissions }), isReady };
}
