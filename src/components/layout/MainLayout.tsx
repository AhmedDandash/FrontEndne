'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setIsHydrated = useAuthStore((state) => state.setIsHydrated);

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

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
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
          <Breadcrumbs />
          <div className={styles.pageContent}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
