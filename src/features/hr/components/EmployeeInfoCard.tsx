'use client';

import { Descriptions, Skeleton, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import type { HREmployee } from '@/types/hr.types';

interface EmployeeInfoCardProps {
  employee?: HREmployee;
  loading?: boolean;
  /** Show salary info (only on Loans form) */
  showSalary?: boolean;
}

export default function EmployeeInfoCard({
  employee,
  loading = false,
  showSalary = false,
}: EmployeeInfoCardProps) {
  const language = useAuthStore((s) => s.language);
  const sessionName = useAuthStore((s) => s.username);
  const isAr = language === 'ar';

  const displayName = isAr
    ? (employee?.nameAr || sessionName || '—')
    : (employee?.nameEn || sessionName || '—');

  if (loading && !sessionName) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  if (!employee && !sessionName) return null;

  const items = [
    {
      key: 'name',
      label: isAr ? 'اسم الموظف' : 'Employee Name',
      children: displayName,
    },
    {
      key: 'number',
      label: isAr ? 'رقم الموظف' : 'Employee No.',
      children: employee?.employeeNumber || '—',
    },
    {
      key: 'id',
      label: isAr ? 'رقم الهوية' : 'ID Number',
      children: employee?.idNumber || '—',
    },
    {
      key: 'job',
      label: isAr ? 'المسمى الوظيفي' : 'Job Title',
      children: employee?.jobName || '—',
    },
    {
      key: 'dept',
      label: isAr ? 'القسم' : 'Department',
      children: employee?.departmentName || '—',
    },
    {
      key: 'nationality',
      label: isAr ? 'الجنسية' : 'Nationality',
      children: employee?.nationalityName || '—',
    },
  ];

  const salaryItems = showSalary && employee
    ? [
        {
          key: 'basic',
          label: isAr ? 'الراتب الأساسي' : 'Basic Salary',
          children: employee.basicSalary?.toLocaleString() ?? '—',
        },
        {
          key: 'housing',
          label: isAr ? 'بدل السكن' : 'Housing Allowance',
          children: employee.housingAllowance?.toLocaleString() ?? '—',
        },
        {
          key: 'mobility',
          label: isAr ? 'بدل المواصلات' : 'Mobility Allowance',
          children: employee.mobilityAllowance?.toLocaleString() ?? '—',
        },
        {
          key: 'other',
          label: isAr ? 'بدلات أخرى' : 'Other Allowances',
          children: employee.otherAllowances?.toLocaleString() ?? '—',
        },
        {
          key: 'total',
          label: isAr ? 'إجمالي الراتب' : 'Total Salary',
          children: <strong>{employee.totalSalary?.toLocaleString() ?? '—'}</strong>,
        },
        {
          key: 'hiring',
          label: isAr ? 'تاريخ التعيين' : 'Hiring Date',
          children: employee.hiringDate ?? '—',
        },
      ]
    : [];

  return (
    <Card
      size="small"
      title={
        <span>
          <UserOutlined style={{ marginInlineEnd: 8 }} />
          {isAr ? 'بيانات الموظف' : 'Employee Information'}
        </span>
      }
      style={{ marginBottom: 16, background: '#f8fafc' }}
    >
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        items={[...items, ...salaryItems]}
      />
    </Card>
  );
}
