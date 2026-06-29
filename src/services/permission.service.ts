/**
 * Permission Service
 *
 * Persists the page→roles access matrix. The backend currently has no endpoint
 * for page-level permissions, so the matrix lives in localStorage. The async
 * signatures and single choke-point mean that when an endpoint is added, only
 * the bodies below change — hooks, UI and enforcement stay identical:
 *
 *   getPermissions  → api.get(API_ENDPOINTS.ADMIN.PAGE_PERMISSIONS)
 *   savePermissions → api.put(API_ENDPOINTS.ADMIN.PAGE_PERMISSIONS, matrix)
 */

import {
  PERMISSIONS_STORAGE_KEY,
  type PermissionMatrix,
} from '@/config/pagePermissions.config';

/** Synchronous read — used as React Query `initialData` to avoid a load flash. */
export function getPermissionsSync(): PermissionMatrix {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PermissionMatrix) : {};
  } catch {
    return {};
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
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(matrix));
    return matrix;
  },
};

export default PermissionService;
