'use client';

import { useState, useMemo } from 'react';
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
  Input,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AdvancedFilterPanel } from '@/components/filters';
import { useHRPermissionRequests } from '@/hooks/api/useHR';
import { RequestStatus, type PermissionRequestDto } from '@/types/hr.types';
import styles from './PermissionRequests.module.css';

const { Title } = Typography;

// Status enum is 1=Approved, 2=Rejected, 3=Pending (verified live) — see RequestStatus.
const STATUS_COLOR: Record<number, string> = {
  [RequestStatus.Pending]: 'warning',
  [RequestStatus.Approved]: 'success',
  [RequestStatus.Rejected]: 'error',
};
const STATUS_LABEL: Record<number, string> = {
  [RequestStatus.Pending]: 'قيد الانتظار',
  [RequestStatus.Approved]: 'موافق عليه',
  [RequestStatus.Rejected]: 'مرفوض',
};

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

  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const runAction = (id: string, fn: (id: string) => Promise<unknown>) => {
    setActioningId(id);
    return fn(id).finally(() => setActioningId(null));
  };

  const pendingCount  = permissionRequests.filter((r) => r.status === RequestStatus.Pending).length;
  const approvedCount = permissionRequests.filter((r) => r.status === RequestStatus.Approved).length;
  const rejectedCount = permissionRequests.filter((r) => r.status === RequestStatus.Rejected).length;

  const filteredRequests = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return permissionRequests.filter((r) => {
      if (statusFilter != null && r.status !== statusFilter) return false;
      if (q) {
        const haystack = `${r.employeeName ?? ''} ${r.reasons ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [permissionRequests, statusFilter, searchText]);

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
        if (record.status !== RequestStatus.Pending) return null;
        return (
          <Space>
            <Tooltip title="موافقة">
              <Popconfirm
                title="تأكيد الموافقة على طلب الاستئذان؟"
                onConfirm={() => runAction(record.id, approvePermissionRequest)}
                okText="موافقة"
                cancelText="إلغاء"
              >
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  loading={isApproving && actioningId === record.id}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="رفض">
              <Popconfirm
                title="تأكيد رفض طلب الاستئذان؟"
                onConfirm={() => runAction(record.id, rejectPermissionRequest)}
                okText="رفض"
                cancelText="إلغاء"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  loading={isRejecting && actioningId === record.id}
                />
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
            <Statistic title="قيد الانتظار" value={pendingCount} styles={{ content: { color: '#faad14' } }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="موافق عليها" value={approvedCount} styles={{ content: { color: '#52c41a' } }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="مرفوضة" value={rejectedCount} styles={{ content: { color: '#ff4d4f' } }} />
          </Card>
        </Col>
      </Row>

      <AdvancedFilterPanel
        activeCount={statusFilter != null ? 1 : 0}
        onClear={() => setStatusFilter(undefined)}
        quickFilters={
          <>
            <Input
              placeholder="بحث بالاسم أو السبب..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div>
              <label className={styles.filterLabel}>تصفية بالحالة</label>
              <Select
                placeholder="تصفية بالحالة"
                allowClear
                style={{ width: 180 }}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={[
                  { value: RequestStatus.Pending, label: 'قيد الانتظار' },
                  { value: RequestStatus.Approved, label: 'موافق عليه' },
                  { value: RequestStatus.Rejected, label: 'مرفوض' },
                ]}
              />
            </div>
          </>
        }
      />

      <Card>
        <Table<PermissionRequestDto>
          dataSource={filteredRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (total) => `إجمالي: ${total} طلب`,
          }}
          locale={{
            emptyText:
              statusFilter != null || searchText
                ? 'لا توجد نتائج مطابقة'
                : 'لا توجد طلبات استئذان',
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
