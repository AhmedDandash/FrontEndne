'use client';

import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHRPermissionRequests } from '@/hooks/api/useHR';
import type { PermissionRequestDto } from '@/types/hr.types';

const { Title } = Typography;

const STATUS_COLOR: Record<number, string> = { 1: 'warning', 2: 'success', 3: 'error' };
const STATUS_LABEL: Record<number, string> = { 1: 'قيد الانتظار', 2: 'موافق عليه', 3: 'مرفوض' };

const TYPE_LABEL: Record<number, string> = {
  1: 'تأخير صباحي',
  2: 'خروج وعودة',
  3: 'خروج مبكر',
};

const NATURE_LABEL: Record<number, string> = {
  1: 'رسمي',
  2: 'شخصي',
};

export default function PermissionRequestsPage() {
  const {
    permissionRequests,
    isLoading,
    refetch,
    approvePermissionRequest,
    rejectPermissionRequest,
    isApproving,
    isRejecting,
  } = useHRPermissionRequests();

  const pendingCount  = permissionRequests.filter((r) => r.status === 1).length;
  const approvedCount = permissionRequests.filter((r) => r.status === 2).length;
  const rejectedCount = permissionRequests.filter((r) => r.status === 3).length;

  const columns: ColumnsType<PermissionRequestDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
    },
    {
      title: 'تاريخ الاستئذان',
      dataIndex: 'permissionDate',
      width: 140,
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'نوع الاستئذان',
      dataIndex: 'permissionType',
      width: 130,
      render: (v: number) => (
        <Tag color="blue">{TYPE_LABEL[v] ?? `نوع ${v}`}</Tag>
      ),
    },
    {
      title: 'الطبيعة',
      dataIndex: 'permissionNature',
      width: 90,
      render: (v: number) => NATURE_LABEL[v] ?? '—',
    },
    {
      title: 'الوقت',
      key: 'time',
      width: 110,
      render: (_, r) => {
        if (r.permissionType === 1) return r.comeLateTime || '—';
        if (r.permissionType === 2) return `${r.partTimeStart || '—'} — ${r.partTimeFinish || '—'}`;
        if (r.permissionType === 3) return r.outEarlyTime || '—';
        return '—';
      },
    },
    {
      title: 'الأسباب',
      dataIndex: 'reasons',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      width: 130,
      render: (v: number) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? `حالة ${v}`}</Tag>
      ),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        if (record.status !== 1) return null;
        return (
          <Space>
            <Tooltip title="موافقة">
              <Popconfirm
                title="تأكيد الموافقة على طلب الاستئذان؟"
                onConfirm={() => approvePermissionRequest(record.id)}
                okText="موافقة"
                cancelText="إلغاء"
              >
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  loading={isApproving}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="رفض">
              <Popconfirm
                title="تأكيد رفض طلب الاستئذان؟"
                onConfirm={() => rejectPermissionRequest(record.id)}
                okText="رفض"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<CloseOutlined />} loading={isRejecting} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <ClockCircleOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>سجل طلبات الاستئذان</Title>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>تحديث</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="قيد الانتظار" value={pendingCount} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="موافق عليها" value={approvedCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="مرفوضة" value={rejectedCount} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<PermissionRequestDto>
          dataSource={permissionRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد طلبات استئذان' }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
