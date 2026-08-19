'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { purgeStaleBackendSession } from '@/lib/auth/backendGuard';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Must run first: wipes stale tokens/branch state from a previous
      // backend deployment before we trust anything in localStorage below.
      purgeStaleBackendSession();

      const token = localStorage.getItem('authToken');
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!token && !isPublicRoute) {
        // No token and trying to access protected route
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      if (token && pathname === '/login') {
        // Has token but on login page - use replace so back button doesn't return to login
        router.replace('/dashboard');
        return;
      }

      setIsAuthenticated(!!token || isPublicRoute);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f0f2f5',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
