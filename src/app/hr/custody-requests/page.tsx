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
  Modal,
  Descriptions,
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
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHRCustodyRequests, useHREmployees } from '@/hooks/api/useHR';
import { RequestStatus, type CustodyRequestDto, type CustodyRequestItemDto } from '@/types/hr.types';

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

const itemColumns: ColumnsType<CustodyRequestItemDto> = [
  {
    title: '#',
    key: 'idx',
    width: 40,
    render: (_: any, __: any, i: number) => i + 1,
  },
  {
    title: 'نوع العهدة',
    dataIndex: 'custodyTypeName',
    render: (v) => v || '—',
  },
  {
    title: 'الكمية',
    dataIndex: 'quantity',
    width: 80,
    render: (v) => v ?? '—',
  },
  {
    title: 'تاريخ التسليم',
    dataIndex: 'deliveryDate',
    render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
  },
  {
    title: 'النوع',
    dataIndex: 'temporal',
    width: 90,
    render: (v) =>
      v == null ? '—' : <Tag color={v ? 'orange' : 'blue'}>{v ? 'مؤقتة' : 'دائمة'}</Tag>,
  },
];

export default function CustodyRequestsPage() {
  const [detailRecord, setDetailRecord] = useState<CustodyRequestDto | null>(null);

  const {
    custodyRequests,
    isLoading,
    refetch,
    approveCustodyRequest,
    rejectCustodyRequest,
    isApproving,
    isRejecting,
  } = useHRCustodyRequests();

  const { employees } = useHREmployees({ pageSize: 500 });
  const employeeMap = Object.fromEntries(
    employees.map((e) => [e.id, e.nameAr || e.nameEn || e.id])
  );

  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const runAction = (id: string, fn: (id: string) => Promise<unknown>) => {
    setActioningId(id);
    return fn(id).finally(() => setActioningId(null));
  };

  const pendingCount  = custodyRequests.filter((r) => r.status === RequestStatus.Pending).length;
  const approvedCount = custodyRequests.filter((r) => r.status === RequestStatus.Approved).length;
  const rejectedCount = custodyRequests.filter((r) => r.status === RequestStatus.Rejected).length;

  const filteredRequests = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return custodyRequests.filter((r) => {
      if (statusFilter != null && r.status !== statusFilter) return false;
      if (q) {
        const employeeName = r.employeeId ? (employeeMap[r.employeeId] ?? '') : '';
        const haystack = `${employeeName} ${r.details ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [custodyRequests, statusFilter, searchText, employeeMap]);

  const columns: ColumnsType<CustodyRequestDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeId',
      render: (v) => employeeMap[v] ?? v ?? '—',
    },
    {
      title: 'التفاصيل',
      dataIndex: 'details',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'عدد الأصناف',
      key: 'itemsCount',
      width: 110,
      render: (_, record) => record.items?.length ?? 0,
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
      width: 130,
      render: (_, record) => {
        const isPending = record.status === RequestStatus.Pending;
        return (
          <Space>
            <Tooltip title="عرض التفاصيل">
              <Button type="text" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)} />
            </Tooltip>
            {isPending && (
              <>
                <Tooltip title="موافقة">
                  <Popconfirm
                    title="تأكيد الموافقة على طلب العهدة؟"
                    onConfirm={() => runAction(record.id, approveCustodyRequest)}
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
                    title="تأكيد رفض طلب العهدة؟"
                    onConfirm={() => runAction(record.id, rejectCustodyRequest)}
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
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <InboxOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>سجل طلبات العهد</Title>
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

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="بحث بالموظف أو التفاصيل..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
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
        </Space>

        <Table<CustodyRequestDto>
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
                : 'لا توجد طلبات عهد',
          }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!detailRecord}
        title={<Space><InboxOutlined />تفاصيل طلب العهدة</Space>}
        onCancel={() => setDetailRecord(null)}
        footer={<Button onClick={() => setDetailRecord(null)}>إغلاق</Button>}
        width={680}
        destroyOnHidden
      >
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="الموظف" span={2}>
                {detailRecord.employeeId ? (employeeMap[detailRecord.employeeId] ?? detailRecord.employeeId) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="الحالة">
                <Tag color={STATUS_COLOR[detailRecord.status ?? 0] ?? 'default'}>
                  {STATUS_LABEL[detailRecord.status ?? 0] ?? `حالة ${detailRecord.status}`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="عدد الأصناف">
                {detailRecord.items?.length ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="التفاصيل" span={2}>
                {detailRecord.details || '—'}
              </Descriptions.Item>
            </Descriptions>

            {detailRecord.items && detailRecord.items.length > 0 && (
              <>
                <Title level={5} style={{ marginBottom: 8 }}>أصناف العهد</Title>
                <Table
                  dataSource={detailRecord.items}
                  columns={itemColumns}
                  rowKey={(r, i) => r.id ?? String(i)}
                  pagination={false}
                  size="small"
                  bordered
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
