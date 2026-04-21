/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { LoginDto, AuthResponse } from '@/types/api.types';

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

        // Keep compatibility with middleware that checks refreshToken cookie
        if (authData?.refreshToken) {
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
   * Add admin user (renamed from register — new API: POST /api/V1/Auth/add-admin)
   */
  static async addAdmin(userData: any): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.ADD_ADMIN, userData);
    return response.data;
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Clear local storage and cookies regardless of API response
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        sessionStorage.clear();

        // Best-effort clear of legacy non-HttpOnly cookie (refresh cookie is HttpOnly)
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'authToken=; path=/; max-age=0';
      }
    }
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
