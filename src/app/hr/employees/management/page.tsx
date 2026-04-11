'use client';

import React, { useState } from 'react';
import {
  Table,
  Input,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Space,
  Tooltip,
} from 'antd';
import { SearchOutlined, ReloadOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useEmployees } from '@/hooks/api/useHR';
import type { Employee, EmployeesFilterDto } from '@/types/hr.types';

export default function EmployeesManagementPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<EmployeesFilterDto>({});
  const [search, setSearch] = useState({ nameAr: '', loginName: '', email: '' });

  const { data: employees = [], isLoading } = useEmployees(filter);

  const handleSearch = () => setFilter({ ...search });
  const handleReset = () => {
    setSearch({ nameAr: '', loginName: '', email: '' });
    setFilter({});
  };

  const columns: ColumnsType<Employee> = [
    {
      title: isAr ? 'رقم الموظف' : 'Emp. No.',
      dataIndex: 'employeeNumber',
      width: 110,
    },
    {
      title: isAr ? 'الاسم' : 'Name',
      render: (_, r) => (isAr ? r.nameAr : r.nameEn),
    },
    {
      title: isAr ? 'البريد الإلكتروني' : 'Email',
      dataIndex: 'email',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'اسم المستخدم' : 'Login',
      dataIndex: 'loginName',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'الوظيفة' : 'Job',
      dataIndex: 'jobName',
    },
    {
      title: isAr ? 'القسم' : 'Department',
      dataIndex: 'departmentName',
    },
    {
      title: isAr ? 'رقم الهوية' : 'ID No.',
      dataIndex: 'idNumber',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'isActive',
      render: (v) =>
        v ? (
          <Tag color="success">{isAr ? 'نشط' : 'Active'}</Tag>
        ) : (
          <Tag color="default">{isAr ? 'غير نشط' : 'Inactive'}</Tag>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: () => (
        <Tooltip title={isAr ? 'عرض' : 'View'}>
          <Button type="text" icon={<EyeOutlined />} size="small" />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'إدارة الموظفين' : 'Employees Management'} icon={<TeamOutlined />} />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="bottom">
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
              </label>
              <Input
                value={search.nameAr}
                onChange={(e) => setSearch((p) => ({ ...p, nameAr: e.target.value }))}
                allowClear
              />
            </div>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'اسم المستخدم' : 'Login Name'}
              </label>
              <Input
                value={search.loginName}
                onChange={(e) => setSearch((p) => ({ ...p, loginName: e.target.value }))}
                allowClear
              />
            </div>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <Input
                value={search.email}
                onChange={(e) => setSearch((p) => ({ ...p, email: e.target.value }))}
                allowClear
              />
            </div>
          </Col>
          <Col>
            <Space>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                {isAr ? 'إعادة تعيين' : 'Reset'}
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {isAr ? 'بحث' : 'Search'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `${t} ${isAr ? 'موظف' : 'employees'}` }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
