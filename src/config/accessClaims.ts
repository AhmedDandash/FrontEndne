export type MeClaimsState = 'success' | 'error' | 'pending' | 'anonymous';
export type AuthMeQueryState = 'success' | 'error' | 'pending';
export type TokenRefreshClaimsState = 'idle' | 'pending' | 'error';

export const AUTH_ME_PENDING_FALLBACK_MS = 800;

export interface CurrentAccessClaims {
  roles: string[];
  permissions: string[];
}

export interface ResolveMeClaimsStateInput {
  isAuthenticated: boolean;
  queryState: AuthMeQueryState;
  tokenRefreshState: TokenRefreshClaimsState;
}

function toStringArray(raw: unknown): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

export function resolveCurrentAccessClaims(
  state: MeClaimsState,
  me: { roles?: string[] | null; permissions?: string[] | null } | null | undefined,
  jwtFallback: CurrentAccessClaims
): CurrentAccessClaims {
  if (state === 'success') {
    return {
      roles: toStringArray(me?.roles),
      permissions: toStringArray(me?.permissions),
    };
  }

  if (state === 'pending' || state === 'error') {
    return jwtFallback;
  }

  return { roles: [], permissions: [] };
}

export function resolveMeClaimsState({
  isAuthenticated,
  queryState,
  tokenRefreshState,
}: ResolveMeClaimsStateInput): MeClaimsState {
  if (!isAuthenticated) return 'anonymous';
  if (tokenRefreshState === 'pending') return 'pending';
  if (tokenRefreshState === 'error') return 'error';
  return queryState;
}

export function isCurrentAccessClaimsReady(
  state: MeClaimsState,
  isAuthenticated: boolean,
  pendingFallbackElapsed: boolean
): boolean {
  if (!isAuthenticated || state === 'anonymous') return true;
  if (state === 'success' || state === 'error') return true;
  return pendingFallbackElapsed;
}
