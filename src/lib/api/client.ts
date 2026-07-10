/**
 * API Client
 * Configured Axios instance with interceptors for authentication, error handling, and logging
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { useAuthStore, getJwtBranchId } from '@/store/authStore';
import type { ApiError } from '@/types/api.types';

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

/**
 * True when the server rejected a request because the `X-Branch-Id` header was
 * missing or not a valid branch GUID (e.g. the selected branch was deleted or
 * the value got corrupted). Message text is matched loosely — the backend
 * returns it in Arabic but always includes the literal "X-Branch-Id".
 */
function isBranchHeaderError(status: number, data: ApiError | undefined): boolean {
  return status === 400 && !!data?.message && data.message.includes('X-Branch-Id');
}

/**
 * Auth / unauthenticated endpoints that must NOT carry the `X-Branch-Id`
 * header (they run before a branch context exists, or don't require auth):
 * login, refresh-token, forgot-password, reset-password. Matched by path
 * substring so it stays correct even for endpoints not yet in api.config.
 */
const BRANCH_HEADER_EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

function isBranchExcludedRoute(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BRANCH_HEADER_EXCLUDED_PATHS.some((p) => lower.includes(p));
}

/**
 * Resolve the branch id for the `X-Branch-Id` header.
 *
 * Primary source is the branch the user explicitly selected after login
 * (persisted by the store / BranchGate). Before that selection exists we fall
 * back to the JWT `branchId` claim (the user's home branch) so bootstrap calls
 * still carry a valid header — the backend REQUIRES `X-Branch-Id` on some
 * authenticated endpoints (e.g. `/api/V1/Auth/me` returns 400 without it). The
 * BranchGate still governs which branch the user actually works in; this fallback
 * only prevents the pre-selection 400s.
 */
function getCurrentBranchId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('branchId') || getJwtBranchId();
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;
  private refreshPromise: Promise<string | null> | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const isDev = process.env.NEXT_PUBLIC_ENV === 'development';

        // Add auth token from localStorage/sessionStorage
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (isDev) {
            console.warn('⚠️ No token found for request:', config.url);
          }

          // Attach the tenant/branch scope header on every authenticated request.
          // Excluded from auth endpoints (login/refresh/forgot/reset) which run
          // before a branch context exists or don't require authentication.
          if (!isBranchExcludedRoute(config.url)) {
            const branchId = getCurrentBranchId();
            if (branchId) {
              config.headers['X-Branch-Id'] = branchId;
            } else if (isDev) {
              console.warn('⚠️ No branchId available for X-Branch-Id header:', config.url);
            }
          }
        }

        // Log request metadata in development only — never log token values or
        // request bodies (they may contain passwords / PII).
        if (isDev) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            hasAuth: !!config.headers?.Authorization,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NEXT_PUBLIC_ENV === 'development') {
          console.log('✅ API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError<ApiError>) => {
        // Handle errors
        if (error.response) {
          const { status, data } = error.response;
          const originalRequest = error.config as AxiosRequestConfigWithRetry | undefined;
          const requestUrl = originalRequest?.url || '';
          const isAuthRoute =
            requestUrl.includes(API_ENDPOINTS.AUTH.LOGIN) ||
            requestUrl.includes(API_ENDPOINTS.AUTH.LOGOUT) ||
            requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN);

          // Server rejected the branch scope → clear the selection so the user
          // is sent back to the branch gate to pick a valid branch again.
          // Guarded on a branch being currently selected: while the gate is
          // open no branch is set and other calls may legitimately 400 here.
          if (typeof window !== 'undefined' && isBranchHeaderError(status, data)) {
            const authState = useAuthStore.getState();
            if (authState.branchId) {
              authState.setBranch(null, null);
              const isAr = authState.language === 'ar';
              message.warning(
                isAr
                  ? 'انتهت صلاحية الفرع المحدد، الرجاء اختيار الفرع من جديد'
                  : 'Your selected branch is no longer valid — please choose a branch again'
              );
            }
          }

          // Handle 401 Unauthorized
          if (status === 401) {
            if (!isAuthRoute && originalRequest && !originalRequest._retry) {
              originalRequest._retry = true;

              if (!this.refreshPromise) {
                this.refreshPromise = this.refreshAccessToken().finally(() => {
                  this.refreshPromise = null;
                });
              }

              const newToken = await this.refreshPromise;
              if (newToken) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('authToken', newToken);
                }
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${newToken}`,
                };

                return this.client(originalRequest);
              }
            }

            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('branchId');
              localStorage.removeItem('branchName');

              // Redirect to login (only on client side)
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            }
          }

          // Handle 403 Forbidden
          if (status === 403) {
            console.error('🚫 Access Forbidden:', data?.message || 'You do not have permission');
          }

          // Handle 404 Not Found
          if (status === 404) {
            console.error('🔍 Not Found:', error.config?.url);
          }

          // Handle 500 Server Error
          if (status >= 500) {
            console.error('🔥 Server Error:', data?.message || 'Internal server error');
          }

          // Log all errors in development
          if (process.env.NEXT_PUBLIC_ENV === 'development') {
            console.error('❌ API Error:', {
              url: error.config?.url,
              status,
              message: data?.message,
              errors: data?.errors,
            });
          }
        } else if (error.request) {
          console.error('🌐 Network Error: No response received', error.message);
        } else {
          console.error('⚠️ Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Exchange the stored refresh token for a new access token.
   *
   * Uses a bare axios call (no interceptors) so that a failed refresh does not
   * recurse back through the 401 handler. On success, persists BOTH the new
   * access token and the rotated refresh token (the backend issues a fresh
   * refresh token on every call and revokes the old one). Returns the new
   * access token, or null if refresh is not possible / fails — in which case
   * the caller logs the user out.
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return null;

    try {
      // Bare axios (bypasses this.client's interceptors). BASE_URL is '' in the
      // browser, so this resolves to the same-origin `/api/*` proxy route.
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
        { refreshToken: storedRefreshToken },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      // Unwrap the standard { success, data, ... } envelope (also tolerate a
      // flat payload just in case).
      const payload: any = response.data?.data ?? response.data;
      const newAccessToken: string | null = payload?.accessToken ?? payload?.token ?? null;
      const newRefreshToken: string | null = payload?.refreshToken ?? null;

      if (!newAccessToken) return null;

      localStorage.setItem('authToken', newAccessToken);
      if (newRefreshToken) {
        // Store the rotated refresh token; the old one is now revoked server-side.
        localStorage.setItem('refreshToken', newRefreshToken);
        document.cookie = `refreshToken=${encodeURIComponent(newRefreshToken)}; path=/; SameSite=Lax`;
      }

      return newAccessToken;
    } catch (refreshError) {
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        console.error('Refresh token failed:', refreshError);
      }
      return null;
    }
  }

  /**
   * GET request
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * POST request
   */
  public async post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  public async put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * PATCH request
   */
  public async patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Get raw axios instance (for advanced use cases)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export convenience methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),
  post: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.post<T, D>(url, data, config),
  put: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.put<T, D>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config),
  patch: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig) =>
    apiClient.patch<T, D>(url, data, config),
};
