'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Select,
  DatePicker,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useHRAttendance } from '@/hooks/api/useHR';
import type { AttendanceFilterDto, AttendanceRecord } from '@/types/hr.types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLOR: Record<string, string> = {
  Present: 'success',
  Absent: 'error',
  Late: 'warning',
};

export default function HRAttendancePage() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<AttendanceFilterDto>({});

  const { records, isLoading, filterAttendance, checkIn, checkOut, isCheckingIn, isCheckingOut } =
    useHRAttendance(filter);

  const handleFilter = async () => {
    const values = form.getFieldsValue();
    const dto: AttendanceFilterDto = {
      employeeId: values.employeeId || undefined,
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      status: values.status || undefined,
    };
    setFilter(dto);
    await filterAttendance(dto);
  };

  const handleReset = async () => {
    form.resetFields();
    const dto: AttendanceFilterDto = {};
    setFilter(dto);
    await filterAttendance(dto);
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'اسم الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
    },
    {
      title: 'التاريخ',
      dataIndex: 'date',
      render: (v) => (v ? new Date(v).toLocaleDateString('ar-SA') : '—'),
    },
    {
      title: 'وقت الحضور',
      dataIndex: 'checkInTime',
      render: (v) =>
        v ? (
          <Space>
            <LoginOutlined style={{ color: '#52c41a' }} />
            {new Date(v).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'وقت الانصراف',
      dataIndex: 'checkOutTime',
      render: (v) =>
        v ? (
          <Space>
            <LogoutOutlined style={{ color: '#1677ff' }} />
            {new Date(v).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'دقائق التأخير',
      dataIndex: 'lateMinutes',
      render: (v) =>
        v != null && v > 0 ? <Tag color="warning">{v} دقيقة</Tag> : <Tag color="success">في الوقت</Tag>,
    },
    {
      title: 'دقائق الإضافي',
      dataIndex: 'overtimeMinutes',
      render: (v) =>
        v != null && v > 0 ? <Tag color="blue">{v} دقيقة</Tag> : '—',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      render: (v) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{v || '—'}</Tag>
      ),
    },
  ];

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <ClockCircleOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>الحضور والانصراف</Title>
        </Space>
        <Space>
          <Button
            type="default"
            icon={<LoginOutlined />}
            loading={isCheckingIn}
            onClick={() => checkIn()}
          >
            تسجيل حضور
          </Button>
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            loading={isCheckingOut}
            onClick={() => checkOut()}
          >
            تسجيل انصراف
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="dateRange" label="الفترة الزمنية">
                <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="status" label="الحالة">
                <Select
                  allowClear
                  placeholder="اختر الحالة"
                  options={[
                    { value: 'Present', label: 'حاضر' },
                    { value: 'Absent', label: 'غائب' },
                    { value: 'Late', label: 'متأخر' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label=" " style={{ marginTop: 2 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    loading={isLoading}
                    onClick={handleFilter}
                  >
                    بحث
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    إعادة تعيين
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {records.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="حاضر" value={presentCount} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="غائب" value={absentCount} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="متأخر" value={lateCount} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table<AttendanceRecord>
          dataSource={records}
          columns={columns}
          rowKey={(r) => r.id ?? `${r.employeeId}-${r.date}`}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد سجلات حضور — استخدم الفلتر للبحث' }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
