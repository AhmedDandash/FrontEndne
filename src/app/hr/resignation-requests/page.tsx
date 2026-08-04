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
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AdvancedFilterPanel } from '@/components/filters';
import { useHRResignationRequests } from '@/hooks/api/useHR';
import { RequestStatus, type ResignationRequestDto } from '@/types/hr.types';
import styles from './ResignationRequests.module.css';

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

export default function ResignationRequestsPage() {
  const {
    resignationRequests,
    isLoading,
    refetch,
    approveResignationRequest,
    rejectResignationRequest,
    isApproving,
    isRejecting,
  } = useHRResignationRequests();

  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const runAction = (id: string, fn: (id: string) => Promise<unknown>) => {
    setActioningId(id);
    return fn(id).finally(() => setActioningId(null));
  };

  const pendingCount  = resignationRequests.filter((r) => r.status === RequestStatus.Pending).length;
  const approvedCount = resignationRequests.filter((r) => r.status === RequestStatus.Approved).length;
  const rejectedCount = resignationRequests.filter((r) => r.status === RequestStatus.Rejected).length;

  const filteredRequests = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return resignationRequests.filter((r) => {
      if (statusFilter != null && r.status !== statusFilter) return false;
      if (q) {
        const haystack = `${r.employeeName ?? ''} ${r.reasons ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [resignationRequests, statusFilter, searchText]);

  const columns: ColumnsType<ResignationRequestDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
    },
    {
      title: 'تاريخ تقديم الاستقالة',
      dataIndex: 'resignationDate',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'تاريخ آخر يوم عمل',
      dataIndex: 'endDate',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
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
        const isPending = record.status === RequestStatus.Pending;
        if (!isPending) return null;
        return (
          <Space>
            <Tooltip title="موافقة">
              <Popconfirm
                title="تأكيد الموافقة على طلب الاستقالة؟"
                onConfirm={() => runAction(record.id, approveResignationRequest)}
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
                title="تأكيد رفض طلب الاستقالة؟"
                onConfirm={() => runAction(record.id, rejectResignationRequest)}
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
          <FileTextOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>سجل طلبات الاستقالة</Title>
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
        <Table<ResignationRequestDto>
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
                : 'لا توجد طلبات استقالة',
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
