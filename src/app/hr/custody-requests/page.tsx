'use client';

import { useState } from 'react';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHRCustodyRequests } from '@/hooks/api/useHR';
import type { CustodyRequestDto, CustodyRequestItemDto } from '@/types/hr.types';

const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  Pending: 'قيد الانتظار',
  Approved: 'موافق عليه',
  Rejected: 'مرفوض',
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
      v == null ? '—' : (
        <Tag color={v ? 'orange' : 'blue'}>{v ? 'مؤقتة' : 'دائمة'}</Tag>
      ),
  },
  {
    title: 'ملاحظات',
    dataIndex: 'shortNote',
    render: (v) => v || '—',
    ellipsis: true,
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

  const pendingCount = custodyRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = custodyRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = custodyRequests.filter((r) => r.status === 'Rejected').length;

  const columns: ColumnsType<CustodyRequestDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
    },
    {
      title: 'التفاصيل',
      dataIndex: 'details',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'الأسباب',
      dataIndex: 'reasons',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'عدد الأصناف',
      key: 'itemsCount',
      width: 110,
      render: (_, record) => record.custodyItems?.length ?? '—',
    },
    {
      title: 'تاريخ الطلب',
      dataIndex: 'createdAt',
      width: 130,
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      width: 130,
      render: (v) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v ?? '—'}</Tag>
      ),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 130,
      render: (_, record) => {
        const isPending = record.status === 'Pending';
        return (
          <Space>
            <Tooltip title="عرض التفاصيل">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setDetailRecord(record)}
              />
            </Tooltip>
            {isPending && (
              <>
                <Tooltip title="موافقة">
                  <Popconfirm
                    title="تأكيد الموافقة على طلب العهدة؟"
                    onConfirm={() => approveCustodyRequest(record.id)}
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
                    title="تأكيد رفض طلب العهدة؟"
                    onConfirm={() => rejectCustodyRequest(record.id)}
                    okText="رفض"
                    cancelText="إلغاء"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      loading={isRejecting}
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
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          تحديث
        </Button>
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
        <Table<CustodyRequestDto>
          dataSource={custodyRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد طلبات عهد' }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!detailRecord}
        title={
          <Space>
            <InboxOutlined />
            تفاصيل طلب العهدة
          </Space>
        }
        onCancel={() => setDetailRecord(null)}
        footer={
          <Button onClick={() => setDetailRecord(null)}>إغلاق</Button>
        }
        width={700}
        destroyOnClose
      >
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="الموظف">
                {detailRecord.employeeName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="الحالة">
                <Tag color={STATUS_COLOR[detailRecord.status ?? ''] ?? 'default'}>
                  {STATUS_LABEL[detailRecord.status ?? ''] ?? detailRecord.status ?? '—'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ الطلب">
                {detailRecord.createdAt ? dayjs(detailRecord.createdAt).format('YYYY/MM/DD') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="عدد الأصناف">
                {detailRecord.custodyItems?.length ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="التفاصيل" span={2}>
                {detailRecord.details || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="الأسباب" span={2}>
                {detailRecord.reasons || '—'}
              </Descriptions.Item>
            </Descriptions>

            {detailRecord.custodyItems && detailRecord.custodyItems.length > 0 && (
              <>
                <Title level={5} style={{ marginBottom: 8 }}>أصناف العهد</Title>
                <Table
                  dataSource={detailRecord.custodyItems}
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
