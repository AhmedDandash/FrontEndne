'use client';

import React, { useState } from 'react';
import { Table, Tag, Button, Tooltip } from 'antd';
import { EyeOutlined, SendOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useHROutbox } from '@/hooks/api/useHR';
import { HR_PROCESS_STATE } from '@/constants/hr.enums';
import { getEnumLabel } from '@/constants/enums';
import RequestStatusBadge from '@/features/hr/components/RequestStatusBadge';
import RequestsFilterPanel from '@/features/hr/components/RequestsFilterPanel';
import type { HRRequestSummary, HRRequestsFilterDto } from '@/types/hr.types';

export default function RequestsOutboxPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<HRRequestsFilterDto>({});

  const { data: requests = [], isLoading } = useHROutbox(filter);

  const columns: ColumnsType<HRRequestSummary> = [
    {
      title: '#',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: isAr ? 'نوع الطلب' : 'Request Type',
      dataIndex: 'processState',
      render: (v) => <Tag>{getEnumLabel(HR_PROCESS_STATE, v, language)}</Tag>,
    },
    {
      title: isAr ? 'اسم الموظف' : 'Employee',
      dataIndex: 'employeeName',
    },
    {
      title: isAr ? 'رقم الموظف' : 'Emp. No.',
      dataIndex: 'employeeNumber',
    },
    {
      title: isAr ? 'القسم' : 'Department',
      dataIndex: 'departmentName',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'result',
      render: (v) => <RequestStatusBadge result={v} />,
    },
    {
      title: isAr ? 'تاريخ الإنشاء' : 'Created At',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
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
      <HRPageHeader title={isAr ? 'صندوق الصادر – الطلبات' : 'Requests Outbox'} icon={<SendOutlined />} />

      <RequestsFilterPanel onFilter={setFilter} loading={isLoading} />

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15, showTotal: (total) => `${total} ${isAr ? 'طلب' : 'requests'}` }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}
