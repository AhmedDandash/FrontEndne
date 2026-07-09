'use client';

import { Layout, Dropdown, Avatar, Button } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import BranchSwitcher from './BranchSwitcher';
import Image from 'next/image';
import styles from './Header.module.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileDrawer: () => void;
}

export default function Header({ collapsed, onToggleSidebar, onToggleMobileDrawer }: HeaderProps) {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);
  const { logout } = useAuth();

  const storedUsername = useAuthStore((state) => state.username);

  const displayName = storedUsername || (language === 'ar' ? 'المستخدم' : 'User');

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: language === 'ar' ? 'الملف الشخصي' : 'Profile',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password',
      onClick: () => router.push('/change-password'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: language === 'ar' ? 'الإعدادات' : 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className={styles.header}>
      {/* Left: toggle buttons */}
      <div className={styles.headerLeft}>
        {/* Desktop Toggle */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          className={`${styles.toggleBtn} ${styles.desktopOnly}`}
        />

        {/* Mobile Toggle */}
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={onToggleMobileDrawer}
          className={`${styles.toggleBtn} ${styles.mobileOnly}`}
        />
      </div>

      {/* Center: Logo (visible on all screen sizes) */}
      <div className={styles.headerCenter}>
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={260}
          height={70}
          className={styles.headerLogo}
          priority
        />
      </div>

      {/* Right: branch, language, notifications, user */}
      <div className={styles.headerRight}>
        {/* Active branch switcher */}
        <BranchSwitcher />

        {/* Language Switcher */}
        <div className={styles.langSwitcher}>
          <Button
            type="text"
            icon={<GlobalOutlined />}
            onClick={() => handleLanguageChange(language === 'ar' ? 'en' : 'ar')}
            className={styles.langBtn}
          >
            <span className={styles.desktopOnly}>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </Button>
        </div>


        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement={language === 'ar' ? 'bottomLeft' : 'bottomRight'}
          trigger={['click']}
        >
          <div className={styles.userInfo}>
            <Avatar icon={<UserOutlined />} className={styles.avatar} />
            <span className={`${styles.userName} ${styles.desktopOnly}`}>{displayName}</span>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
}
