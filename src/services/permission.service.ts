/**
 * Permission Service
 *
 * Persists admin overrides for the page→roles access matrix. The backend is
 * the authorization source of truth; the frontend matrix controls UX-level menu
 * and route visibility. Defaults come from the backend RBAC guide, then any
 * saved localStorage override is merged on top.
 *
 *   getPermissions  → api.get(API_ENDPOINTS.ADMIN.PAGE_PERMISSIONS)
 *   savePermissions → api.put(API_ENDPOINTS.ADMIN.PAGE_PERMISSIONS, matrix)
 */

import {
  PERMISSIONS_STORAGE_KEY,
  type PermissionMatrix,
} from '@/config/pagePermissions.config';
import { DEFAULT_ROLE_PAGE_MATRIX } from '@/config/defaultRolePageMatrix';
import { mergePermissionMatrixWithDefaults } from '@/config/pagePermissionRequirements';

export function mergeWithDefaultMatrix(matrix: PermissionMatrix | null | undefined): PermissionMatrix {
  return mergePermissionMatrixWithDefaults(DEFAULT_ROLE_PAGE_MATRIX, matrix);
}

/** Synchronous read — used as React Query `initialData` to avoid a load flash. */
export function getPermissionsSync(): PermissionMatrix {
  if (typeof window === 'undefined') return mergeWithDefaultMatrix(null);
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return mergeWithDefaultMatrix(null);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? mergeWithDefaultMatrix(parsed as PermissionMatrix)
      : mergeWithDefaultMatrix(null);
  } catch {
    return mergeWithDefaultMatrix(null);
  }
}

export const PermissionService = {
  /** Load the current page→roles matrix. */
  async getPermissions(): Promise<PermissionMatrix> {
    return getPermissionsSync();
  },

  /** Persist the full page→roles matrix. */
  async savePermissions(matrix: PermissionMatrix): Promise<PermissionMatrix> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot save permissions on the server');
    }
    const merged = mergeWithDefaultMatrix(matrix);
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  },
};

export default PermissionService;
