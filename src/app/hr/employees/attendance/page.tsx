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
  Space,
} from 'antd';
import { SearchOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import { useHRAttendance, useHREmployees } from '@/hooks/api/useHR';
import { HR_ATTENDANCE_STATUS } from '@/constants/hr.enums';
import { getEnumLabel } from '@/constants/enums';
import type { AttendanceRecord, AttendanceFilterDto } from '@/types/hr.types';

const STATUS_COLORS: Record<number, string> = {
  0: 'default',
  1: 'success',
  2: 'error',
  3: 'warning',
};

export default function AttendancePage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<AttendanceFilterDto>({});
  const [empId, setEmpId] = useState<string | undefined>();
  const [day, setDay] = useState<string | undefined>();

  const { data: records = [], isLoading } = useHRAttendance(filter);
  const { data: employees = [] } = useHREmployees();

  const handleSearch = () => setFilter({ employeeId: empId, attendanceDay: day });
  const handleReset = () => {
    setEmpId(undefined);
    setDay(undefined);
    setFilter({});
  };

  const empOptions = employees.map((e) => ({
    value: e.id,
    label: isAr ? e.nameAr : e.nameEn,
  }));

  const columns: ColumnsType<AttendanceRecord> = [
    { title: '#', dataIndex: 'id', width: 60 },
    { title: isAr ? 'الموظف' : 'Employee', dataIndex: 'employeeName' },
    { title: isAr ? 'رقم الموظف' : 'Emp. No.', dataIndex: 'employeeNumber' },
    {
      title: isAr ? 'التاريخ' : 'Date',
      dataIndex: 'attendanceDay',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
      sorter: (a, b) => new Date(a.attendanceDay).getTime() - new Date(b.attendanceDay).getTime(),
    },
    {
      title: isAr ? 'وقت الحضور' : 'Check In',
      dataIndex: 'checkInTime',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'وقت الانصراف' : 'Check Out',
      dataIndex: 'checkOutTime',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'status',
      render: (v) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>
          {getEnumLabel(HR_ATTENDANCE_STATUS, v, language)}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'الحضور والانصراف' : 'Attendance & Check-Out'} icon={<ClockCircleOutlined />} />

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
          <Col xs={24} sm={8} md={5}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'اليوم' : 'Day'}
              </label>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(d) => setDay(d?.format('YYYY-MM-DD'))}
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
        dataSource={records}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 700 }}
      />
    </div>
  );
}
