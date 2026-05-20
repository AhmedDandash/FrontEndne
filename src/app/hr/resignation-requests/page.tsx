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
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHRResignationRequests } from '@/hooks/api/useHR';
import type { ResignationRequestDto } from '@/types/hr.types';

const { Title } = Typography;

// 1=Pending, 2=Approved, 3=Rejected
const STATUS_COLOR: Record<number, string> = { 1: 'warning', 2: 'success', 3: 'error' };
const STATUS_LABEL: Record<number, string> = { 1: 'قيد الانتظار', 2: 'موافق عليه', 3: 'مرفوض' };

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

  const pendingCount  = resignationRequests.filter((r) => r.status === 1).length;
  const approvedCount = resignationRequests.filter((r) => r.status === 2).length;
  const rejectedCount = resignationRequests.filter((r) => r.status === 3).length;

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
        const isPending = record.status === 1;
        if (!isPending) return null;
        return (
          <Space>
            <Tooltip title="موافقة">
              <Popconfirm
                title="تأكيد الموافقة على طلب الاستقالة؟"
                onConfirm={() => approveResignationRequest(record.id)}
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
                title="تأكيد رفض طلب الاستقالة؟"
                onConfirm={() => rejectResignationRequest(record.id)}
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
          <FileTextOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>سجل طلبات الاستقالة</Title>
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
        <Table<ResignationRequestDto>
          dataSource={resignationRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد طلبات استقالة' }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
