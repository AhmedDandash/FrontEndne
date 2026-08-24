/**
 * Page Permissions hooks
 *
 *  - useCurrentRoles    : the signed-in user's roles (from /api/V1/Auth/me, with
 *                         a JWT role-claim fallback for forward-compatibility)
 *                         and permissions (from /me, with JWT fallback)
 *  - usePagePermissions : load + save the page→roles matrix (management screen)
 *  - useCanAccess       : combine roles + matrix into an access decision used by
 *                         the Sidebar and the route guard
 *  - useHasPermission   : gate buttons/actions using backend permission claims
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { PermissionService, getPermissionsSync } from '@/services/permission.service';
import { extractApiError } from '@/lib/api/unwrap';
import {
  isAdminRole,
  resolvePageKey,
  isPageConfigured,
  type PermissionMatrix,
} from '@/config/pagePermissions.config';
import { hasAccessPermission } from '@/config/appPermissions';
import { canAccessPageWithPermissionRequirements } from '@/config/pagePermissionRequirements';
import {
  AUTH_ME_PENDING_FALLBACK_MS,
  isCurrentAccessClaimsReady,
  resolveMeClaimsState,
  resolveCurrentAccessClaims,
  type TokenRefreshClaimsState,
  type MeClaimsState,
} from '@/config/accessClaims';
import { AUTH_ME_QUERY_KEY, subscribeToAuthTokenRefresh } from '@/config/authMeQuery';

const PERMISSIONS_QK = ['page-permissions'] as const;
const EMPTY_PERMISSION_MATRIX: PermissionMatrix = {};

function toStringArray(raw: unknown): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

function decodeTokenClaims(claimNames: string[]): string[] {
  if (typeof window === 'undefined') return [];
  const token = AuthService.getToken();
  if (!token) return [];
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    for (const claimName of claimNames) {
      const values = toStringArray(payload?.[claimName]);
      if (values.length > 0) return values;
    }
  } catch {
    // JWT decode failed; callers will continue with an empty fallback.
  }
  return [];
}

/** Decode role claims from the stored JWT if `/me` is unavailable. */
function decodeTokenRoles(): string[] {
  return decodeTokenClaims([
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ]);
}

/** Decode permission claims from the stored JWT if `/me` is unavailable. */
function decodeTokenPermissions(): string[] {
  return decodeTokenClaims([
    'permission',
    'permissions',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/permission',
  ]);
}

export function useCurrentRoles() {
  const isAuthenticated = AuthService.isAuthenticated();
  const [tokenRefreshState, setTokenRefreshState] = useState<{
    revision: number;
    state: TokenRefreshClaimsState;
  }>({ revision: 0, state: 'idle' });
  const tokenRefreshRevisionRef = useRef(0);
  const query = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => AuthService.me(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const refetchMe = query.refetch;
  const queryClaimsState = query.isSuccess ? 'success' : query.isError ? 'error' : 'pending';
  const claimsState: MeClaimsState = resolveMeClaimsState({
    isAuthenticated,
    queryState: queryClaimsState,
    tokenRefreshState: tokenRefreshState.state,
  });
  const [pendingFallbackElapsed, setPendingFallbackElapsed] = useState(false);

  useEffect(() => {
    return subscribeToAuthTokenRefresh(() => {
      const refreshRevision = tokenRefreshRevisionRef.current + 1;
      tokenRefreshRevisionRef.current = refreshRevision;
      setTokenRefreshState({ revision: refreshRevision, state: 'pending' });

      void refetchMe().then((result) => {
        setTokenRefreshState((current) => {
          if (current.revision !== refreshRevision) return current;
          return {
            revision: current.revision,
            state: result.isSuccess ? 'idle' : 'error',
          };
        });
      });
    });
  }, [refetchMe]);

  useEffect(() => {
    if (claimsState !== 'pending') {
      setPendingFallbackElapsed(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPendingFallbackElapsed(true);
    }, AUTH_ME_PENDING_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [claimsState]);

  const { roles, permissions } = useMemo(
    () =>
      resolveCurrentAccessClaims(
        claimsState,
        query.data,
        {
          roles: decodeTokenRoles(),
          permissions: decodeTokenPermissions(),
        }
      ),
    [claimsState, query.data]
  );

  // Keep the Zustand-cached display name (read by the Header/navbar and any
  // other component that wants an instant paint before /me resolves) in sync
  // with the authoritative /me response. Without this, `authStore.username`
  // is only ever set once from localStorage at module-load time, so the
  // navbar shows a stale/empty name after login until a full page reload.
  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    const liveName = query.data.fullName?.trim() || query.data.username?.trim() || null;
    if (liveName && useAuthStore.getState().username !== liveName) {
      useAuthStore.getState().setUsername(liveName);
    }
  }, [query.isSuccess, query.data]);

  return {
    roles,
    permissions,
    me: query.data,
    isLoading: query.isLoading,
    isReady: isCurrentAccessClaimsReady(claimsState, isAuthenticated, pendingFallbackElapsed),
  };
}

export function useHasPermission() {
  const { roles, permissions, isReady } = useCurrentRoles();

  const has = useMemo(
    () => (required: string | readonly string[]) =>
      hasAccessPermission({ roles, permissions }, required),
    [roles, permissions]
  );

  return { has, roles, permissions, isReady };
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
  const { roles, permissions, me, isLoading, isReady } = useCurrentRoles();
  const query = useQuery({
    queryKey: PERMISSIONS_QK,
    queryFn: () => PermissionService.getPermissions(),
    initialData: getPermissionsSync,
    staleTime: Infinity,
  });
  const matrix = query.data ?? EMPTY_PERMISSION_MATRIX;

  return useMemo(() => {
    const canAccess = (pageKey: string | null) =>
      canAccessPageWithPermissionRequirements(pageKey, roles, permissions, matrix);

    const check = (pathname: string): 'allow' | 'deny' | 'pending' => {
      const key = resolvePageKey(pathname);
      if (!key) return 'allow';
      if (!isReady) return 'pending';
      if (isAdminRole(roles)) return 'allow';
      if (!isPageConfigured(key, matrix)) return 'deny';
      return canAccess(key) ? 'allow' : 'deny';
    };

    return { canAccess, check, roles, permissions, me, isLoading, isReady };
  }, [roles, permissions, matrix, me, isLoading, isReady]);
}
