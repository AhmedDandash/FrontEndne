'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCanAccess } from '@/hooks/api/usePagePermissions';
import AccessDenied from '@/components/common/AccessDenied';
import BranchGate from '@/components/branch/BranchGate';
import styles from './MainLayout.module.css';

const { Content } = Layout;

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password'];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const pathname = usePathname();
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setIsHydrated = useAuthStore((state) => state.setIsHydrated);
  const { check } = useCanAccess();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!token && !isPublicRoute) {
        // No token and trying to access protected route - redirect to login
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        setIsAuthorized(false);
        setIsAuthChecking(false);
        return;
      }

      if (token && pathname === '/login') {
        // Has token but on login page - redirect to dashboard
        router.replace('/dashboard');
        setIsAuthorized(false);
        setIsAuthChecking(false);
        return;
      }

      setIsAuthorized(true);
      setIsAuthChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Set document direction immediately on mount to prevent glitching
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    setIsHydrated(true);
  }, [language, setIsHydrated]);

  // Show loading while checking auth
  if (isAuthChecking) {
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

  // Don't show layout on public pages (login, register, forgot-password)
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Prevent unauthorized access
  if (!isAuthorized) {
    return null;
  }

  // Prevent flash of unstyled content during hydration
  if (!isHydrated) {
    return null;
  }

  // Require an explicit branch selection before entering the app. The chosen
  // branch drives the X-Branch-Id header on every request.
  if (!branchId) {
    return <BranchGate />;
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
  };

  // Role-based page guard: 'allow' renders the page, 'deny' shows 403,
  // 'pending' waits for the user's roles to load (restricted pages only).
  const accessState = check(pathname);

  const renderContent = () => {
    if (accessState === 'pending') {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <Spin size="large" />
        </div>
      );
    }
    if (accessState === 'deny') {
      return <AccessDenied />;
    }
    return children;
  };

  return (
    <Layout className={styles.mainLayout} hasSider>
      <Sidebar
        collapsed={collapsed}
        mobileDrawerVisible={mobileDrawerVisible}
        onMobileDrawerClose={() => setMobileDrawerVisible(false)}
      />

      <Layout
        className={`${styles.contentLayout} ${collapsed ? styles.contentLayoutCollapsed : ''}`}
      >
        <Header
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onToggleMobileDrawer={toggleMobileDrawer}
        />

        <Content className={styles.content}>
          <div className={styles.pageContent}>{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
