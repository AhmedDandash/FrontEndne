/**
 * useAuth Hook
 * React Query hook for authentication operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { AuthService } from '@/services';
import type { LoginDto, RegisterDto } from '@/types/api.types';
import { useSearchParams } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginDto) => AuthService.login(credentials),
    onSuccess: async () => {
      message.success('تم تسجيل الدخول بنجاح / Login successful');

      // Small delay to ensure localStorage write completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify token before redirect
      const token = AuthService.getToken();
      console.log('🎯 Pre-redirect token check:', token ? 'Token exists ✓' : 'No token ✗');

      // Check for redirect parameter and decode it
      const redirectParam = searchParams.get('redirect');
      const redirectPath = redirectParam ? decodeURIComponent(redirectParam) : '/dashboard';

      // Use replace to prevent going back to login page after successful login
      router.replace(redirectPath);
    },
    onError: (error: any) => {
      console.error('🚨 Login error:', error);
      message.error(error.response?.data?.message || 'فشل تسجيل الدخول / Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterDto) => AuthService.addAdmin(userData),
    onSuccess: () => {
      message.success('تم التسجيل بنجاح / Registration successful');
      router.push('/login');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل التسجيل / Registration failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      queryClient.clear();
      message.success('تم تسجيل الخروج بنجاح / Logged out successfully');
      // Use replace to clear history after logout
      router.replace('/login');
    },
    onError: () => {
      // Still clear local data even if API call fails
      queryClient.clear();
      router.replace('/login');
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
