'use client';

import React, { useState } from 'react';
import {
  Table,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Progress,
  Space,
} from 'antd';
import { SearchOutlined, ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useHRLeaveBalance, useHREmployees } from '@/hooks/api/useHR';
import type { LeaveBalance, LeaveBalanceFilterDto } from '@/types/hr.types';

export default function LeaveBalancePage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';
  const currentYear = new Date().getFullYear();

  const [filter, setFilter] = useState<LeaveBalanceFilterDto>({ year: currentYear });
  const [empId, setEmpId] = useState<string | undefined>();
  const [year, setYear] = useState<number>(currentYear);

  const { data: balances = [], isLoading } = useHRLeaveBalance(filter);
  const { data: employees = [] } = useHREmployees();

  const handleSearch = () => setFilter({ employeeId: empId, year });
  const handleReset = () => {
    setEmpId(undefined);
    setYear(currentYear);
    setFilter({ year: currentYear });
  };

  const empOptions = employees.map((e) => ({
    value: e.id,
    label: isAr ? e.nameAr : e.nameEn,
  }));

  const columns: ColumnsType<LeaveBalance> = [
    { title: isAr ? 'الموظف' : 'Employee', dataIndex: 'employeeName' },
    { title: isAr ? 'السنة' : 'Year', dataIndex: 'year', width: 80 },
    {
      title: isAr ? 'الرصيد السنوي' : 'Annual Balance',
      dataIndex: 'annualBalance',
      render: (v) => v,
    },
    {
      title: isAr ? 'المستخدم' : 'Used',
      dataIndex: 'usedBalance',
      render: (v) => v,
    },
    {
      title: isAr ? 'المتبقي' : 'Remaining',
      dataIndex: 'remainingBalance',
      render: (v, r) => (
        <Space>
          <span>{v}</span>
          <Progress
            percent={Math.round((v / r.annualBalance) * 100)}
            size="small"
            style={{ width: 80 }}
            strokeColor={v < 5 ? '#ff4d4f' : '#52c41a'}
          />
        </Space>
      ),
    },
    {
      title: isAr ? 'رصيد المرضية' : 'Sick Balance',
      dataIndex: 'sickBalance',
    },
    {
      title: isAr ? 'مرضية مستخدمة' : 'Sick Used',
      dataIndex: 'usedSickBalance',
    },
    {
      title: isAr ? 'مرضية متبقية' : 'Sick Remaining',
      dataIndex: 'remainingSickBalance',
      render: (v, r) => (
        <Space>
          <span>{v}</span>
          <Progress
            percent={r.sickBalance ? Math.round((v / r.sickBalance) * 100) : 0}
            size="small"
            style={{ width: 80 }}
            strokeColor={v < 3 ? '#ff4d4f' : '#1890ff'}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'رصيد الإجازات' : 'Leave Balance'} icon={<CalendarOutlined />} />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="bottom">
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'الموظف' : 'Employee'}
              </label>
              <Select
                style={{ width: '100%' }}
                allowClear
                showSearch
                value={empId}
                onChange={setEmpId}
                options={empOptions}
                placeholder={isAr ? 'اختر موظفاً' : 'Select employee'}
                filterOption={(input, opt) =>
                  String(opt?.label).toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'السنة' : 'Year'}
              </label>
              <InputNumber
                style={{ width: '100%' }}
                min={2000}
                max={2100}
                value={year}
                onChange={(v) => setYear(v ?? currentYear)}
              />
            </div>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
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
        dataSource={balances}
        rowKey="employeeId"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}
