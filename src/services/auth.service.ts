/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  LoginDto,
  AuthResponse,
  AddAdmin,
  ChangePasswordRequestDTO,
  RefreshTokenRequestDTO,
  RevokeRefreshTokenRequestDTO,
  MeResponse,
} from '@/types/api.types';

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginDto): Promise<AuthResponse> {
    const payload = {
      email: credentials.email ?? credentials.username ?? '',
      password: credentials.password ?? '',
    };

    const response = await api.post<any>(API_ENDPOINTS.AUTH.LOGIN, payload);

    // Store token if present
    if (typeof window !== 'undefined') {
      // Support both direct auth payloads and wrapped envelopes: { success, data, ... }
      const responseData: any = response.data;
      const authData: any = responseData?.data ?? responseData;
      const tokenValue = authData?.accessToken || authData?.token;

      if (tokenValue) {
        localStorage.setItem('authToken', tokenValue);
        localStorage.removeItem('authRoles');
        localStorage.removeItem('authPermissions');

        // Clear any prior branch selection so this login must pick a branch
        // (the BranchGate blocks the app until a branch is chosen).
        localStorage.removeItem('branchId');
        localStorage.removeItem('branchName');

        // Persist the refresh token so the API client can silently renew the
        // access token when it expires (see ApiClient.refreshAccessToken).
        if (authData?.refreshToken) {
          localStorage.setItem('refreshToken', authData.refreshToken);
          // Keep compatibility with middleware that checks the refreshToken cookie
          document.cookie = `refreshToken=${encodeURIComponent(authData.refreshToken)}; path=/; SameSite=Lax`;
        }

        const userData = authData?.user;
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          // Cache user ID and username for header display
          if (userData.id) {
            localStorage.setItem('userId', String(userData.id));
          }
          if (userData.fullName || userData.username) {
            localStorage.setItem('username', userData.fullName || userData.username);
          }
        }

        // Fallback: decode the JWT payload to get user claims
        if (!authData?.user?.id) {
          try {
            const payloadBase64 = tokenValue.split('.')[1];
            const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
            const claimId =
              payload?.nameid ||
              payload?.sub ||
              payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            const claimName =
              payload?.unique_name ||
              payload?.name ||
              payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
            if (claimId) localStorage.setItem('userId', String(claimId));
            if (claimName) localStorage.setItem('username', claimName);
          } catch {
            // JWT decode failed — not fatal
          }
        }

        // Prefer fullName from auth payload for header display when provided
        if (authData?.fullName) {
          localStorage.setItem('username', String(authData.fullName));
        }
      } else {
        console.error('No token found in response data');
        console.error('Response data structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No token in login response');
      }
    }

    return (response.data?.data ?? response.data) as AuthResponse;
  }

  /**
   * Add admin user — POST /api/V1/Auth/add-admin
   */
  static async addAdmin(userData: AddAdmin): Promise<AuthResponse> {
    const response = await api.post<any>(API_ENDPOINTS.AUTH.ADD_ADMIN, userData);
    return response.data?.data ?? response.data;
  }

  /**
   * Change password — PATCH /api/V1/Auth/change-password
   */
  static async changePassword(dto: ChangePasswordRequestDTO): Promise<void> {
    await api.patch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, dto);
  }

  /**
   * Refresh access token — POST /api/V1/Auth/refresh-token
   */
  static async refreshToken(dto: RefreshTokenRequestDTO): Promise<AuthResponse> {
    const response = await api.post<any>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, dto);
    return response.data?.data ?? response.data;
  }

  /**
   * Revoke refresh token (logout) — POST /api/V1/Auth/logout
   */
  static async revokeToken(dto: RevokeRefreshTokenRequestDTO): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT, dto);
  }

  /**
   * Get current user info — GET /api/V1/Auth/me
   */
  static async me(): Promise<MeResponse> {
    const response = await api.get<any>(API_ENDPOINTS.AUTH.ME);
    const me = (response.data?.data ?? response.data) as MeResponse;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authRoles', JSON.stringify(me.roles ?? []));
      localStorage.setItem('authPermissions', JSON.stringify(me.permissions ?? []));
    }
    return me;
  }

  /**
   * Logout user — POST /api/V1/Auth/logout
   *
   * The backend's RevokeRefreshTokenRequestDTO requires `refreshToken` in the
   * body (confirmed live: an empty body 400s with "The RefreshToken field is
   * required"). Without it this call never actually revoked anything server-side
   * — the token stayed valid — while the client still behaved as logged out.
   */
  static async logout(): Promise<void> {
    const storedRefreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    try {
      await api.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined,
      );
    } finally {
      AuthService.clearAuthStorage();
    }
  }

  /**
   * Clear all client-side auth state (tokens, cached user/roles/permissions,
   * branch selection, cookies) without calling the backend. Shared by logout()
   * and by the backend-cutover session guard (see src/lib/auth/backendGuard.ts)
   * — kept as a single source of truth so the two stay in sync.
   */
  static clearAuthStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authRoles');
    localStorage.removeItem('authPermissions');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('branchId');
    localStorage.removeItem('branchName');
    sessionStorage.clear();

    // Both cookies are written via `document.cookie` at login time (see
    // login() above), so neither is actually HttpOnly — clear both here.
    // Previously only authToken was cleared, so the refreshToken cookie
    // (which middleware.ts's edge gate keys off) survived logout.
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'authToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; max-age=0';
  }

  /**
   * Get current auth token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user from storage
   */
  static getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}
