import { AuthService } from '@/services/auth.service';

const BACKEND_ID_KEY = 'sigma.backendId';

/**
 * Guards against stale auth/branch state left over from a *different* backend
 * deployment (e.g. the sigma-api.runasp.net -> api.sigma.sa cutover, both of
 * which serve their own separate databases). authToken, refreshToken, and
 * branchId are meaningless — or worse, silently valid-looking-but-wrong — once
 * the app talks to a different backend, since branch GUIDs and JWT signing
 * keys are per-deployment. NEXT_PUBLIC_BACKEND_ID must be bumped whenever
 * BACKEND_API_URL is repointed at a backend with different underlying data;
 * on mismatch (or first run) this wipes local auth state and forces a fresh
 * login rather than risk a request scoped to the wrong branch/tenant.
 *
 * Must run before any authenticated query fires — call at the top of
 * AuthGuard's checkAuth(), ahead of reading `authToken`.
 */
export function purgeStaleBackendSession(): void {
  if (typeof window === 'undefined') return;

  const currentBackendId = process.env.NEXT_PUBLIC_BACKEND_ID || 'unknown';
  const storedBackendId = localStorage.getItem(BACKEND_ID_KEY);

  if (storedBackendId === currentBackendId) return;

  AuthService.clearAuthStorage();
  localStorage.setItem(BACKEND_ID_KEY, currentBackendId);
}
