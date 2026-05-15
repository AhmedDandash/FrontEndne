'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Tag,
  Typography,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useHRLeave, useHRLeaveTypes } from '@/hooks/api/useHR';
import type { LeaveRequestDto, CreateLeaveRequestDto } from '@/types/hr.types';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_COLOR: Record<string, string> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Cancelled: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  Pending: 'قيد الانتظار',
  Approved: 'موافق عليه',
  Rejected: 'مرفوض',
  Cancelled: 'ملغى',
};

type ActionType = 'approve' | 'reject';

export default function HRLeavePage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: ActionType; record: LeaveRequestDto } | null>(null);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();

  const {
    leaveRequests,
    isLoading,
    createLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    isCreating,
    isApproving,
    isRejecting,
    isCancelling,
  } = useHRLeave();

  const { leaveTypes } = useHRLeaveTypes();

  const pendingCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'Rejected').length;

  const handleCreate = async () => {
    const values = await form.validateFields();
    const dto: CreateLeaveRequestDto = {
      leaveTypeId: values.leaveTypeId,
      fromDate: values.dateRange[0].format('YYYY-MM-DD'),
      toDate: values.dateRange[1].format('YYYY-MM-DD'),
      reason: values.reason,
    };
    await createLeave(dto);
    setCreateModalOpen(false);
    form.resetFields();
  };

  const handleActionConfirm = async () => {
    if (!actionModal) return;
    const { approvalComment } = commentForm.getFieldsValue();
    if (actionModal.type === 'approve') {
      await approveLeave({ requestId: actionModal.record.id, approvalComment });
    } else {
      await rejectLeave({ requestId: actionModal.record.id, approvalComment });
    }
    setActionModal(null);
    commentForm.resetFields();
  };

  const handleActionCancel = () => {
    setActionModal(null);
    commentForm.resetFields();
  };

  const columns: ColumnsType<LeaveRequestDto> = [
    {
      title: 'الموظف',
      dataIndex: 'employeeName',
      render: (v) => v || '—',
    },
    {
      title: 'نوع الإجازة',
      dataIndex: 'leaveTypeName',
      render: (v) => v || '—',
    },
    {
      title: 'من تاريخ',
      dataIndex: 'fromDate',
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'إلى تاريخ',
      dataIndex: 'toDate',
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'عدد الأيام',
      dataIndex: 'daysCount',
      width: 90,
      render: (v) => (v != null ? `${v} يوم` : '—'),
    },
    {
      title: 'السبب',
      dataIndex: 'reason',
      render: (v) => v || '—',
      ellipsis: true,
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
      title: 'تاريخ الموافقة',
      dataIndex: 'approvedAt',
      render: (v) => (v ? dayjs(v).format('YYYY/MM/DD') : '—'),
    },
    {
      title: 'تعليق القرار',
      dataIndex: 'approvalComment',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 140,
      render: (_, record) => {
        const isPending = record.status === 'Pending';
        const isApproved = record.status === 'Approved';
        return (
          <Space>
            {isPending && (
              <>
                <Tooltip title="موافقة">
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    style={{ color: '#52c41a' }}
                    loading={isApproving}
                    onClick={() => setActionModal({ type: 'approve', record })}
                  />
                </Tooltip>
                <Tooltip title="رفض">
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    loading={isRejecting}
                    onClick={() => setActionModal({ type: 'reject', record })}
                  />
                </Tooltip>
              </>
            )}
            {(isPending || isApproved) && (
              <Tooltip title="إلغاء">
                <Popconfirm
                  title="تأكيد الإلغاء"
                  description={
                    isApproved
                      ? 'الإجازة معتمدة. سيتم استعادة الرصيد عند الإلغاء.'
                      : 'هل تريد إلغاء هذا الطلب؟'
                  }
                  onConfirm={() => cancelLeave(record.id)}
                  okText="إلغاء الطلب"
                  cancelText="تراجع"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<StopOutlined />}
                    style={{ color: '#faad14' }}
                    loading={isCancelling}
                  />
                </Popconfirm>
              </Tooltip>
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
          <CalendarOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>طلبات الإجازات</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          size="large"
        >
          طلب إجازة جديدة
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
            <Statistic title="معتمدة" value={approvedCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="مرفوضة" value={rejectedCount} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<LeaveRequestDto>
          dataSource={leaveRequests}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد طلبات إجازة' }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Leave Modal */}
      <Modal
        open={createModalOpen}
        title="طلب إجازة جديدة"
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={isCreating}
        okText="تقديم الطلب"
        cancelText="إلغاء"
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="leaveTypeId"
            label="نوع الإجازة"
            rules={[{ required: true, message: 'يرجى اختيار نوع الإجازة' }]}
          >
            <Select
              placeholder="اختر نوع الإجازة"
              options={leaveTypes.map((lt) => ({
                value: lt.id,
                label: `${lt.name}${lt.isPaid ? ' (مدفوعة)' : ' (غير مدفوعة)'}`,
                disabled: !lt.isActive,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="فترة الإجازة"
            rules={[{ required: true, message: 'يرجى تحديد فترة الإجازة' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </Form.Item>

          <Form.Item name="reason" label="سبب الإجازة (اختياري)">
            <TextArea rows={3} maxLength={500} showCount placeholder="اكتب سبب الإجازة..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Approve / Reject Modal */}
      <Modal
        open={!!actionModal}
        title={actionModal?.type === 'approve' ? 'الموافقة على الإجازة' : 'رفض الإجازة'}
        onCancel={handleActionCancel}
        onOk={handleActionConfirm}
        confirmLoading={actionModal?.type === 'approve' ? isApproving : isRejecting}
        okText={actionModal?.type === 'approve' ? 'موافقة' : 'رفض'}
        okButtonProps={actionModal?.type === 'reject' ? { danger: true } : undefined}
        cancelText="إلغاء"
        width={480}
        destroyOnClose
      >
        {actionModal && (
          <div style={{ marginBottom: 12, color: '#555' }}>
            <strong>الموظف:</strong> {actionModal.record.employeeName || '—'}&nbsp;&nbsp;
            <strong>الفترة:</strong>{' '}
            {actionModal.record.fromDate ? dayjs(actionModal.record.fromDate).format('YYYY/MM/DD') : '—'}
            {' — '}
            {actionModal.record.toDate ? dayjs(actionModal.record.toDate).format('YYYY/MM/DD') : '—'}
            &nbsp;({actionModal.record.daysCount ?? '—'} يوم)
          </div>
        )}
        <Form form={commentForm} layout="vertical">
          <Form.Item name="approvalComment" label="تعليق القرار (اختياري)">
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder={
                actionModal?.type === 'approve'
                  ? 'أضف ملاحظة للموافقة...'
                  : 'اكتب سبب الرفض...'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
