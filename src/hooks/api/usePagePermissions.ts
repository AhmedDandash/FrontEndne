/**
 * Page Permissions hooks
 *
 *  - useCurrentRoles    : the signed-in user's roles (from /api/V1/Auth/me, with
 *                         a JWT role-claim fallback for forward-compatibility)
 *  - usePagePermissions : load + save the page→roles matrix (management screen)
 *  - useCanAccess       : combine roles + matrix into an access decision used by
 *                         the Sidebar and the route guard
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { AuthService } from '@/services/auth.service';
import { PermissionService, getPermissionsSync } from '@/services/permission.service';
import { extractApiError } from '@/lib/api/unwrap';
import {
  canAccessPage,
  resolvePageKey,
  type PermissionMatrix,
} from '@/config/pagePermissions.config';

const PERMISSIONS_QK = ['page-permissions'] as const;
const ME_QK = ['auth', 'me'] as const;

/** Decode role claims from the stored JWT, if the backend ever adds them. */
function decodeTokenRoles(): string[] {
  if (typeof window === 'undefined') return [];
  const token = AuthService.getToken();
  if (!token) return [];
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    const raw =
      payload?.role ??
      payload?.roles ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (!raw) return [];
    return Array.isArray(raw) ? raw.map(String) : [String(raw)];
  } catch {
    return [];
  }
}

/** The current user's roles. Source of truth is `/api/V1/Auth/me`. */
export function useCurrentRoles() {
  const query = useQuery({
    queryKey: ME_QK,
    queryFn: () => AuthService.me(),
    enabled: AuthService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });

  const roles = useMemo(() => {
    const fromMe = query.data?.roles ?? [];
    if (fromMe.length > 0) return fromMe;
    return decodeTokenRoles();
  }, [query.data]);

  return {
    roles,
    isLoading: query.isLoading,
    // "settled" enough to make an enforcement decision without flashing a 403
    isReady: !AuthService.isAuthenticated() || query.isFetched,
  };
}

/** Load + persist the page→roles matrix (used by the management screen). */
export function usePagePermissions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PERMISSIONS_QK,
    queryFn: () => PermissionService.getPermissions(),
    initialData: getPermissionsSync,
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (matrix: PermissionMatrix) => PermissionService.savePermissions(matrix),
    onSuccess: (saved) => {
      queryClient.setQueryData(PERMISSIONS_QK, saved);
      message.success('تم حفظ الصلاحيات بنجاح');
    },
    onError: (err) => {
      message.error(extractApiError(err, 'فشل حفظ الصلاحيات'));
    },
  });

  return {
    matrix: query.data ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    savePermissions: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

/**
 * Access decision helper for the current user. `check` returns:
 *  - 'allow'   : render the page / show the menu item
 *  - 'deny'    : block (403) / hide the menu item
 *  - 'pending' : roles not yet known for a restricted page → wait
 */
export function useCanAccess() {
  const { roles, isReady } = useCurrentRoles();
  const query = useQuery({
    queryKey: PERMISSIONS_QK,
    queryFn: () => PermissionService.getPermissions(),
    initialData: getPermissionsSync,
    staleTime: Infinity,
  });
  const matrix = query.data ?? {};

  return useMemo(() => {
    const canAccess = (pageKey: string | null) => canAccessPage(pageKey, roles, matrix);

    const check = (pathname: string): 'allow' | 'deny' | 'pending' => {
      const key = resolvePageKey(pathname);
      if (!key) return 'allow';
      if (matrix[key] === undefined) return 'allow'; // unconfigured → open
      if (!isReady) return 'pending'; // restricted page, roles still loading
      return canAccessPage(key, roles, matrix) ? 'allow' : 'deny';
    };

    return { canAccess, check, roles, isReady };
  }, [roles, matrix, isReady]);
}
