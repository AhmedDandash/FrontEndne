'use client';

import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import styles from './Breadcrumbs.module.css';

const pathNameMap: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  statistics: { ar: 'الإحصائيات', en: 'Statistics' },
  'agent-productivity': { ar: 'إنتاجية الوكلاء', en: 'Agent Productivity' },
  'office-productivity': { ar: 'إنتاجية المكتب', en: 'Office Productivity' },
  followup: { ar: 'المتابعة', en: 'Follow-up' },
  applicants: { ar: 'المتقدمون', en: 'Applicants' },
  visas: { ar: 'التأشيرات', en: 'Visas' },
  customers: { ar: 'العملاء', en: 'Customers' },
  contacts: { ar: 'جهات الاتصال', en: 'Contacts' },
  phones: { ar: 'أرقام الهواتف', en: 'Phone Numbers' },
  contracts: { ar: 'العقود', en: 'Contracts' },
  rent: { ar: 'الإيجار', en: 'Rent' },
  delegates: { ar: 'المندوبون', en: 'Delegates' },
  penalties: { ar: 'الغرامات', en: 'Penalties' },
  transmital: { ar: 'النقل', en: 'Transfer' },
  cancellation: { ar: 'الإلغاء', en: 'Cancellation' },
  recruitment: { ar: 'التوظيف', en: 'Recruitment' },
  requests: { ar: 'الطلبات', en: 'Requests' },
  automatic: { ar: 'التلقائي', en: 'Automatic' },
  none: { ar: 'بدون متابعة', en: 'No Follow-up' },
  warranty: { ar: 'الضمان', en: 'Warranty' },
  reports: { ar: 'التقارير', en: 'Reports' },
  arrival: { ar: 'الوصول', en: 'Arrival' },
  alternatives: { ar: 'البدائل', en: 'Alternatives' },
  'employees-productivity': { ar: 'إنتاجية الموظفين', en: 'Employee Productivity' },
  offers: { ar: 'العروض', en: 'Offers' },
  mediation: { ar: 'الوساطة', en: 'Mediation' },
  'rent-prices': { ar: 'أسعار الإيجار', en: 'Rent Prices' },
  communication: { ar: 'التواصل', en: 'Communication' },
  sms: { ar: 'الرسائل النصية', en: 'SMS' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  'auto-sms': { ar: 'الرسائل التلقائية', en: 'Auto SMS' },
  'tracking-sms': { ar: 'رسائل التتبع', en: 'Tracking SMS' },
  agents: { ar: 'الوكلاء', en: 'Agents' },
  assignment: { ar: 'التعيين', en: 'Assignment' },
  'sponsorship-transfer': { ar: 'نقل الكفالة', en: 'Sponsorship Transfer' },
  hr: { ar: 'الموارد البشرية', en: 'HR' },
  departments: { ar: 'الأقسام', en: 'Departments' },
  'requests-archive': { ar: 'أرشيف الطلبات', en: 'Requests Archive' },
  complaints: { ar: 'الشكاوى', en: 'Complaints' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  branch: { ar: 'الفرع', en: 'Branch' },
  documents: { ar: 'المستندات', en: 'Documents' },
  rules: { ar: 'القواعد', en: 'Rules' },
  themes: { ar: 'المظهر', en: 'Themes' },
  webpage: { ar: 'الموقع', en: 'Webpage' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const language = useAuthStore((state) => state.language);

  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  const pathParts = pathname.split('/').filter(Boolean);

  const breadcrumbItems = [
    {
      title: (
        <span onClick={() => router.push('/dashboard')} className={styles.breadcrumbLink}>
          <HomeOutlined />
        </span>
      ),
    },
    ...pathParts.map((part, index) => {
      const path = '/' + pathParts.slice(0, index + 1).join('/');
      const isLast = index === pathParts.length - 1;
      const title = pathNameMap[part]?.[language] || part;

      return {
        title: isLast ? (
          <span className={styles.breadcrumbCurrent}>{title}</span>
        ) : (
          <span onClick={() => router.push(path)} className={styles.breadcrumbLink}>
            {title}
          </span>
        ),
      };
    }),
  ];

  return (
    <div className={styles.breadcrumbContainer}>
      <Breadcrumb items={breadcrumbItems} className={styles.breadcrumb} />
    </div>
  );
}
