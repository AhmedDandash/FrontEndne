'use client';

import { useState, useMemo } from 'react';
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
  Divider,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useHRAttendance, useHREmployees } from '@/hooks/api/useHR';
import type { AttendanceFilterDto, AttendanceRecord } from '@/types/hr.types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Numeric status codes returned by the API
const STATUS_COLOR: Record<number, string> = {
  0: 'default',
  1: 'success',
  2: 'error',
  3: 'warning',
  4: 'blue',
  5: 'purple',
};

const STATUS_LABEL: Record<number, string> = {
  0: 'غير محدد',
  1: 'حاضر',
  2: 'غائب',
  3: 'متأخر',
  4: 'إجازة رسمية',
  5: 'في إجازة',
};

// Render a geolocation audit cell: coordinates as a maps link + distance tag.
function renderLocation(
  lat?: number | null,
  lng?: number | null,
  distance?: number | null
) {
  if (lat == null || lng == null) {
    return <span style={{ color: '#bbb' }}>—</span>;
  }
  return (
    <Space direction="vertical" size={2}>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12 }}
      >
        <EnvironmentOutlined /> {lat.toFixed(5)}, {lng.toFixed(5)}
      </a>
      {distance != null && (
        <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
          {Math.round(distance)} م من الفرع
        </Tag>
      )}
    </Space>
  );
}

export default function HRAttendancePage() {
  const [form] = Form.useForm();
  // The applied filter drives both the server fetch (employeeId only — the
  // backend ignores status/date filters) and client-side narrowing below.
  const [filter, setFilter] = useState<AttendanceFilterDto>({});
  const [hasSearched, setHasSearched] = useState(false);

  const { records, isLoading, checkIn, checkOut, isCheckingIn, isCheckingOut } =
    useHRAttendance({ employeeId: filter.employeeId ?? undefined }, hasSearched);

  const { employees } = useHREmployees({ pageSize: 200 });

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.nameAr || e.nameEn || '—'} ${e.employeeNumber ? `(${e.employeeNumber})` : ''}`.trim(),
  }));

  // Status & date-range filters are NOT honoured by the backend, so apply them
  // client-side on top of the (employee-filtered) result set.
  const displayRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter.status != null && r.status !== filter.status) return false;
      if (filter.fromDate && (!r.attendanceDay || dayjs(r.attendanceDay).isBefore(dayjs(filter.fromDate), 'day')))
        return false;
      if (filter.toDate && (!r.attendanceDay || dayjs(r.attendanceDay).isAfter(dayjs(filter.toDate), 'day')))
        return false;
      return true;
    });
  }, [records, filter]);

  const handleFilter = () => {
    const values = form.getFieldsValue();
    setFilter({
      employeeId: values.employeeId || undefined,
      fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      toDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      status: values.status ?? undefined,
    });
    setHasSearched(true);
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({});
    setHasSearched(true);
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'التاريخ',
      dataIndex: 'attendanceDay',
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
      title: 'موقع الحضور',
      key: 'checkInLocation',
      width: 180,
      render: (_, r) =>
        renderLocation(r.employeeLatitude, r.employeeLongitude, r.distanceFromBranchMeters),
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
      title: 'موقع الانصراف',
      key: 'checkOutLocation',
      width: 180,
      render: (_, r) =>
        renderLocation(
          r.checkOutEmployeeLatitude,
          r.checkOutEmployeeLongitude,
          r.checkOutDistanceFromBranchMeters
        ),
    },
    {
      title: 'دقائق التأخير',
      dataIndex: 'lateMinutes',
      render: (v) =>
        v != null && v > 0 ? (
          <Tag color="warning">{v} دقيقة</Tag>
        ) : (
          <Tag color="success">في الوقت</Tag>
        ),
    },
    {
      title: 'دقائق الإضافي',
      dataIndex: 'overtimeMinutes',
      render: (v) => (v != null && v > 0 ? <Tag color="blue">{v} دقيقة</Tag> : '—'),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      render: (v: number | null | undefined) => {
        if (v == null) return <Tag color="default">—</Tag>;
        return (
          <Tag color={STATUS_COLOR[v] ?? 'default'}>
            {STATUS_LABEL[v] ?? `حالة ${v}`}
          </Tag>
        );
      },
    },
  ];

  const presentCount = displayRecords.filter((r) => r.status === 1).length;
  const absentCount = displayRecords.filter((r) => r.status === 2).length;
  const lateCount = displayRecords.filter((r) => r.status === 3).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Space>
          <ClockCircleOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            الحضور والانصراف
          </Title>
        </Space>
      </div>

      {/* ── Check-In / Check-Out panel ── */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: 14 }}>
            تسجيل الحضور/الانصراف (للمستخدم الحالي)
          </Text>
          <Alert
            type="info"
            showIcon
            icon={<EnvironmentOutlined />}
            title="يتم تحديد الموظف تلقائياً من رمز المصادقة (JWT)، ويُطلب إذن الوصول إلى موقعك عند التسجيل."
            description="يجب أن تكون داخل النطاق الجغرافي المسموح لفرعك. سيُرفض التسجيل إذا تم رفض إذن الموقع أو كنت خارج النطاق."
            style={{ marginBottom: 8 }}
          />
          <Space>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              loading={isCheckingIn}
              onClick={() => checkIn()}
              size="large"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              تسجيل الحضور
            </Button>
            <Button
              icon={<LogoutOutlined />}
              loading={isCheckingOut}
              onClick={() => checkOut()}
              size="large"
              danger
            >
              تسجيل الانصراف
            </Button>
          </Space>
        </Space>
      </Card>

      <Divider style={{ margin: '0 0 16px' }} />

      {/* ── Filter panel ── */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="employeeId" label="الموظف">
                <Select
                  allowClear
                  showSearch
                  placeholder="اختر الموظف (اختياري)"
                  options={employeeOptions}
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
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
                    { value: 1, label: 'حاضر' },
                    { value: 2, label: 'غائب' },
                    { value: 3, label: 'متأخر' },
                    { value: 4, label: 'إجازة رسمية' },
                    { value: 5, label: 'في إجازة' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
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

      {displayRecords.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="حاضر" value={presentCount} styles={{ content: { color: '#52c41a' } }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="غائب" value={absentCount} styles={{ content: { color: '#ff4d4f' } }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="متأخر" value={lateCount} styles={{ content: { color: '#faad14' } }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table<AttendanceRecord>
          dataSource={displayRecords}
          columns={columns}
          rowKey={(r) => r.id ?? `${r.employeeId}-${r.attendanceDay}`}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: hasSearched ? 'لا توجد سجلات حضور مطابقة' : 'استخدم الفلتر للبحث عن سجلات الحضور' }}
          scroll={{ x: 1160 }}
        />
      </Card>
    </div>
  );
}
