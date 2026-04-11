'use client';

import React, { useState } from 'react';
import {
  Table,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Popconfirm,
  Tooltip,
} from 'antd';
import { SearchOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useHRCommissions, useDeleteHRCommission, useHREmployees } from '@/hooks/api/useHR';
import { HR_COMMISSION_TYPE } from '@/constants/hr.enums';
import { getEnumLabel } from '@/constants/enums';
import type { EmployeeCommission, CommissionFilterDto } from '@/types/hr.types';

export default function EmployeeCommissionPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<CommissionFilterDto>({});
  const [empId, setEmpId] = useState<string | undefined>();
  const [dates, setDates] = useState<[string?, string?]>([]);

  const { data: commissions = [], isLoading } = useHRCommissions(filter);
  const { data: employees = [] } = useHREmployees();
  const { mutate: deleteCommission } = useDeleteHRCommission();

  const handleSearch = () =>
    setFilter({
      empId,
      comDate: dates[0],
      comDateTo: dates[1],
    });

  const handleReset = () => {
    setEmpId(undefined);
    setDates([]);
    setFilter({});
  };

  const empOptions = employees.map((e) => ({
    value: e.id,
    label: isAr ? e.nameAr : e.nameEn,
  }));

  const columns: ColumnsType<EmployeeCommission> = [
    { title: '#', dataIndex: 'id', width: 60 },
    { title: isAr ? 'الموظف' : 'Employee', dataIndex: 'employeeName' },
    {
      title: isAr ? 'نوع العمولة' : 'Type',
      dataIndex: 'typeId',
      render: (v) => <Tag>{getEnumLabel(HR_COMMISSION_TYPE, v, language)}</Tag>,
    },
    {
      title: isAr ? 'المبلغ' : 'Amount',
      dataIndex: 'amount',
      render: (v) => v?.toLocaleString(),
    },
    {
      title: isAr ? 'خاضع للضريبة' : 'Taxable',
      dataIndex: 'isTaxable',
      render: (v) =>
        v ? (
          <Tag color="warning">{isAr ? 'نعم' : 'Yes'}</Tag>
        ) : (
          <Tag>{isAr ? 'لا' : 'No'}</Tag>
        ),
    },
    {
      title: isAr ? 'قيمة الضريبة' : 'Tax',
      dataIndex: 'taxValue',
      render: (v) => v?.toLocaleString() ?? '0',
    },
    {
      title: isAr ? 'رسوم البنك' : 'Bank Fees',
      dataIndex: 'bankFees',
      render: (v) => v?.toLocaleString(),
    },
    {
      title: isAr ? 'من تاريخ' : 'From',
      dataIndex: 'comDate',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      title: isAr ? 'إلى تاريخ' : 'To',
      dataIndex: 'comDateTo',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title={isAr ? 'تأكيد الحذف؟' : 'Confirm delete?'}
          onConfirm={() => deleteCommission(record.id)}
        >
          <Tooltip title={isAr ? 'حذف' : 'Delete'}>
            <Button danger type="text" icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'عمولات الموظفين' : 'Employee Commissions'} icon={<DollarOutlined />} />

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
          <Col xs={12} sm={6} md={4}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'من تاريخ' : 'From'}
              </label>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(d) => setDates((p) => [d?.format('YYYY-MM-DD'), p[1]])}
              />
            </div>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'إلى تاريخ' : 'To'}
              </label>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(d) => setDates((p) => [p[0], d?.format('YYYY-MM-DD')])}
              />
            </div>
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              {isAr ? 'بحث' : 'Search'}
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={commissions}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15 }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
