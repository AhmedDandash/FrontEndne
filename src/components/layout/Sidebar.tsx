'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Drawer, Badge } from 'antd';
import {
  // DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  // UserAddOutlined,
  // CalendarOutlined,
  // FileSearchOutlined,
  // GiftOutlined,
  UserOutlined,
  WarningOutlined,
  SettingOutlined,
  ShopOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  mobileDrawerVisible: boolean;
  onMobileDrawerClose: () => void;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function Sidebar({
  collapsed,
  mobileDrawerVisible,
  onMobileDrawerClose,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const language = useAuthStore((state) => state.language);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    // Set selected and open keys based on current path
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      setSelectedKeys([pathname]);
      if (pathParts.length > 1) {
        setOpenKeys([pathParts[0]]);
      }
    }
  }, [pathname]);

  const menuItems: MenuItem[] = [
    // {
    //   key: '/dashboard',
    //   icon: <DashboardOutlined />,
    //   label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
    //   onClick: () => router.push('/dashboard'),
    // },
    {
      key: '/branch/management',
      icon: <ShopOutlined />,
      label: language === 'ar' ? ' الفروع' : 'Branch',
    },
    // {
    //   key: 'statistics',
    //   icon: <BarChartOutlined />,
    //   label: language === 'ar' ? 'الإحصائيات' : 'Statistics',
    //   children: [
    //     {
    //       key: '/statistics/agent-productivity',
    //       label: language === 'ar' ? 'إنتاجية الوكلاء' : 'Agent Productivity',
    //     },
    //     {
    //       key: '/statistics/office-productivity',
    //       label: language === 'ar' ? 'إنتاجية المكتب' : 'Office Productivity',
    //     },
    //     {
    //       key: '/statistics/followup',
    //       label: language === 'ar' ? 'إحصائيات المتابعة' : 'Follow-up Stats',
    //     },
    //     {
    //       key: '/statistics/applicants',
    //       label: language === 'ar' ? 'إحصائيات المتقدمين' : 'Applicant Stats',
    //     },
    //     {
    //       key: '/statistics/visas',
    //       label: language === 'ar' ? 'إحصائيات التأشيرات' : 'Visa Stats',
    //     },
    //   ],
    // },
    {
      key: 'Workers',
      icon: <BarChartOutlined />,
      label: language === 'ar' ? 'العمالة' : 'Workers',
      children: [
        {
          key: '/applicants',
          label: language === 'ar' ? 'العمالة' : 'Workers',
        },
        // {
        //   key: '/applicants/followup',
        //   label: language === 'ar' ? 'متابعة العمال' : 'Workers Follow-up',
        // },
        {
          key: '/applicants/available',
          label: language === 'ar' ? 'العمال المتاحون' : 'Available Applicants',
        },
      ],
    },
    {
      key: 'housing',
      icon: <HomeOutlined />,
      label: language === 'ar' ? 'السكن' : 'Housing',
      children: [
        {
          key: '/housing/management',
          label: language === 'ar' ? 'إدارة السكنات' : 'Housing Management',
        },
        {
          key: '/housing/applicants',
          label: language === 'ar' ? 'العمال بالسكن' : 'Housing Applicants',
        },
      ],
    },
    {
      key: '/customers',
      icon: <ShopOutlined />,
      label: language === 'ar' ? 'العملاء' : 'Customers',
    },
    {
      key: 'contracts',
      icon: <FileTextOutlined />,
      label: language === 'ar' ? 'العقود' : 'Contracts',
      children: [
        {
          key: 'contracts-mediation',
          label: language === 'ar' ? 'عقود الاستقدام ' : 'Mediation',
          children: [
            {
              key: '/contracts/mediationcontract',
              label: language === 'ar' ? 'عقود الاستقدام ' : 'Mediation Contracts',
            },
            {
              key: '/contracts/mediationcontract/automaticfollowup',
              label: language === 'ar' ? 'المتابعة التلقائية' : 'Automatic Follow-up',
            },
            {
              key: '/contracts/mediationcontract/offers',
              label: language === 'ar' ? 'عروض عقود الاستقدام ' : 'Mediation Offers',
            },
          ],
        },
        /* ───── Operation submenu (moved from top-level) ───── */
        {
          key: 'contracts-operation',
          label: language === 'ar' ? 'عقود العاملات المقيمة' : 'Operation Contracts',
          children: [
            {
              key: '/contracts/operation/rent',
              label: language === 'ar' ? 'عقود العاملات المقيمة' : 'Operation Contracts',
            },
            {
              key: '/contracts/operation/collection-renewal',
              label: language === 'ar' ? 'التحصيل والتجديد' : 'Collection & Renewal Operations',
            },
            {
              key: '/contracts/operation/rent-prices-offers',
              label: language === 'ar' ? 'أسعار وعروض التشغيل' : 'Rent Prices & Offers',
            },
          ],
        },
      ],
    },
    // {
    //   key: 'recruitment',
    //   icon: <UserAddOutlined />,
    //   label: language === 'ar' ? 'طلبات الاستقدام' : 'Recruitment',
    //   children: [
    //     {
    //       key: '/recruitment/requests',
    //       label: language === 'ar' ? 'طلبات الاستقدام' : 'Recruitment',
    //     },
    //     {
    //       key: '/recruitment/applicants',
    //       label: language === 'ar' ? 'المتقدمون المتاحون' : 'Available Applicants',
    //     },
    //     {
    //       key: '/recruitment/visas',
    //       label: language === 'ar' ? 'إدارة التأشيرات' : 'Visa Management',
    //     },
    //   ],
    // },
    // {
    //   key: 'followup',
    //   icon: <CalendarOutlined />,
    //   label: language === 'ar' ? 'المتابعة' : 'Follow-up',
    //   children: [
    //     { key: '/followup/none', label: language === 'ar' ? 'بدون متابعة' : 'No Follow-up' },
    //     { key: '/followup/warranty', label: language === 'ar' ? 'الضمان' : 'Warranty' },
    //   ],
    // },
    // {
    //   key: 'reports',
    //   icon: <FileSearchOutlined />,
    //   label: language === 'ar' ? 'التقارير' : 'Reports',
    //   children: [
    //     { key: '/reports/arrival', label: language === 'ar' ? 'تقرير الوصول' : 'Arrival Report' },
    //     {
    //       key: '/reports/alternatives',
    //       label: language === 'ar' ? 'تقرير البدائل' : 'Alternatives Report',
    //     },
    //     {
    //       key: '/reports/employees-productivity',
    //       label: language === 'ar' ? 'إنتاجية الموظفين' : 'Employee Productivity',
    //     },
    //   ],
    // },
    // {
    //   key: 'offers',
    //   icon: <GiftOutlined />,
    //   label: language === 'ar' ? 'العروض' : 'Offers',
    //   children: [
    //     {
    //       key: '/offers/mediation',
    //       label: language === 'ar' ? 'عروض واسعار التوسط الوساطة' : 'Mediation Offers',
    //     },
    //     { key: '/offers/rent', label: language === 'ar' ? 'عروض الإيجار' : 'Rent Offers' },
    //     {
    //       key: '/offers/rent-prices',
    //       label: language === 'ar' ? 'عروض أسعار الإيجار' : 'Rent Price Offers',
    //     },
    //   ],
    // },
    // {
    //   key: 'communication',
    //   icon: <MessageOutlined />,
    //   label: language === 'ar' ? 'التواصل' : 'Communication',
    //   children: [
    //     { key: '/communication/sms', label: language === 'ar' ? 'رسائل العملاء' : 'Customer SMS' },
    //     {
    //       key: '/communication/email',
    //       label: language === 'ar' ? 'إرسال بريد إلكتروني' : 'Send Email',
    //     },
    //     {
    //       key: '/communication/templates-sms',
    //       label: language === 'ar' ? 'إعدادات قوالب الرسائل' : 'SMS Templates Settings',
    //     },
    //     {
    //       key: '/communication/tracking-sms',
    //       label: language === 'ar' ? 'إعدادات قوالب الرسائل' : 'SMS Templates Settings',
    //     },
    //   ],
    // },
    {
      key: '/sponsorship-transfer',
      icon: <ShopOutlined />,
      label: language === 'ar' ? ' نقل الكفالة' : 'Sponsorship Transfer',
    },
    {
      key: 'agents',
      icon: <UserOutlined />,
      label: language === 'ar' ? 'الوكلاء' : 'Agents',
      children: [
        { key: '/agents', label: language === 'ar' ? 'جميع الوكلاء' : 'All Agents' },
        // { key: '/agents/assignment', label: language === 'ar' ? 'تعيين الوكلاء' : 'Assignment' },
        
      ],
    },
    // {
    //   key: 'hr',
    //   icon: <IdcardOutlined />,
    //   label: language === 'ar' ? 'الموارد البشرية' : 'Human Resources',
    //   children: [
    //     {
    //       key: 'hr-requests',
    //       label: language === 'ar' ? 'الطلبات' : 'Requests',
    //       children: [
    //         {
    //           key: '/hr/requests/vacation',
    //           label: language === 'ar' ? 'طلب إجازة' : 'Vacation Request',
    //           onClick: () => router.push('/hr/requests/vacation'),
    //         },
    //         {
    //           key: '/hr/requests/permission',
    //           label: language === 'ar' ? 'طلب إذن' : 'Permission Request',
    //           onClick: () => router.push('/hr/requests/permission'),
    //         },
    //         {
    //           key: '/hr/requests/custody',
    //           label: language === 'ar' ? 'طلب عهدة' : 'Receipt Custody',
    //           onClick: () => router.push('/hr/requests/custody'),
    //         },
    //         {
    //           key: '/hr/requests/job-modification',
    //           label: language === 'ar' ? 'تعديل وظيفي' : 'Job Modification',
    //           onClick: () => router.push('/hr/requests/job-modification'),
    //         },
    //         {
    //           key: '/hr/requests/resignation',
    //           label: language === 'ar' ? 'استقالة' : 'Resignation',
    //           onClick: () => router.push('/hr/requests/resignation'),
    //         },
    //         {
    //           key: '/hr/requests/entitlements',
    //           label: language === 'ar' ? 'مستحقات' : 'Entitlements',
    //           onClick: () => router.push('/hr/requests/entitlements'),
    //         },
    //         {
    //           key: '/hr/requests/loans',
    //           label: language === 'ar' ? 'قرض' : 'Loan',
    //           onClick: () => router.push('/hr/requests/loans'),
    //         },
    //       ],
    //     },
    //     {
    //       key: 'hr-followup',
    //       label: language === 'ar' ? 'المتابعة' : 'Follow-up',
    //       children: [
    //         {
    //           key: '/hr/followup/inbox',
    //           label: language === 'ar' ? 'صندوق الوارد' : 'Requests Inbox',
    //           onClick: () => router.push('/hr/followup/inbox'),
    //         },
    //         {
    //           key: '/hr/followup/outbox',
    //           label: language === 'ar' ? 'صندوق الصادر' : 'Requests Outbox',
    //           onClick: () => router.push('/hr/followup/outbox'),
    //         },
    //       ],
    //     },
    //     {
    //       key: 'hr-employees',
    //       label: language === 'ar' ? 'الموظفون' : 'Employees',
    //       children: [
    //         {
    //           key: '/hr/employees/management',
    //           label: language === 'ar' ? 'إدارة الموظفين' : 'Management',
    //           onClick: () => router.push('/hr/employees/management'),
    //         },
    //         {
    //           key: '/hr/employees/commission',
    //           label: language === 'ar' ? 'العمولات' : 'Commission',
    //           onClick: () => router.push('/hr/employees/commission'),
    //         },
    //         {
    //           key: '/hr/employees/commission-slices',
    //           label: language === 'ar' ? 'شرائح العمولات' : 'Commission Slices',
    //           onClick: () => router.push('/hr/employees/commission-slices'),
    //         },
    //         {
    //           key: '/hr/employees/attendance',
    //           label: language === 'ar' ? 'الحضور والانصراف' : 'Attendance',
    //           onClick: () => router.push('/hr/employees/attendance'),
    //         },
    //         {
    //           key: '/hr/employees/leave-balance',
    //           label: language === 'ar' ? 'رصيد الإجازات' : 'Leave Balance',
    //           onClick: () => router.push('/hr/employees/leave-balance'),
    //         },
    //       ],
    //     },
    //     {
    //       key: '/hr/complaints',
    //       label: language === 'ar' ? 'شكاوى الموظفين' : 'Employee Complaints',
    //       onClick: () => router.push('/hr/complaints'),
    //     },
    //   ],
    // },
    {
      key: '/complaints',
      icon: <WarningOutlined />,
      label: (
        <Badge offset={[10, 0]} size="small">
          {language === 'ar' ? 'الشكاوى' : 'Complaints'}
        </Badge>
      ),
      onClick: () => router.push('/complaints'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: language === 'ar' ? 'الإعدادات' : 'Settings',
      children: [
        {
          key: '/settings/general',
          label: language === 'ar' ? 'الإعدادات العامة' : 'General Settings',
        },
        // { key: '/settings/users', label: language === 'ar' ? 'المستخدمين' : 'Users' },
        // {
        //   key: '/settings/privileges',
        //   label: language === 'ar' ? 'صلاحيات المستخدمين' : 'User Privileges',
        // },
        // { key: '/settings/themes', label: language === 'ar' ? 'المظهر' : 'Themes' },
        // {
        //   key: '/settings/webpage',
        //   label: language === 'ar' ? 'إعدادات الموقع' : 'Webpage Settings',
        // },
        // { key: '/settings/sms', label: language === 'ar' ? 'إعدادات الرسائل' : 'SMS Settings' },
        {
          key: 'mediation-settings',
          label: language === 'ar' ? 'إعدادات عقود الاستقدام' : 'Mediation Settings',
          children: [
            {
              key: '/settings/mediation',
              label: language === 'ar' ? 'إعدادات المتابعة' : 'Follow-Up Settings',
            },
            // {
            //   key: '/contract-creation-requirements',
            //   label: language === 'ar' ? 'متطلبات إنشاء العقود' : 'Contract Requirements',
            // },
          ],
        },
      ],
    },
    // {
    //   key: 'system-settings',
    //   icon: <SettingOutlined />,
    //   label: language === 'ar' ? 'إعدادات النظام' : 'System Settings',
    //   children: [
    //     {
    //       key: 'general-settings',
    //       label: language === 'ar' ? 'الإعدادات العامة' : 'General Settings',
    //       children: [
    //         {
    //           key: '/system/system-entities',
    //           label: language === 'ar' ? 'كيانات النظام' : 'System Entities',
    //         },
    //         {
    //           key: '/system/airline-companies',
    //           label: language === 'ar' ? 'شركات الطيران' : 'Airline Companies',
    //         },
    //       ],
    //     },
    //   ],
    // },
  ];

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
    // Close mobile drawer on navigation
    onMobileDrawerClose();
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const menuContent = (
    <>
      <div className={styles.logoContainer}>
        <Image
          src="/images/logonavbar.png"
          alt="Logo"
          fill
          className={styles.logoImage}
          sizes={collapsed ? '60px' : '200px'}
        />
      </div>

      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={menuItems}
        onClick={handleMenuClick}
        className={styles.menu}
        inlineCollapsed={collapsed}
      />
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`${styles.sidebar} ${styles.desktopSidebar}`}
        width={260}
        collapsedWidth={80}
      >
        {menuContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement={language === 'ar' ? 'right' : 'left'}
        onClose={onMobileDrawerClose}
        open={mobileDrawerVisible}
        className={styles.mobileDrawer}
        size="default"
        closeIcon={null}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.mobileSidebarContent}>{menuContent}</div>
      </Drawer>
    </>
  );
}
