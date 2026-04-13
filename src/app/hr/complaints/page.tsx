'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Card,
  Tag,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/store/authStore';
import {
  useHRComplaints,
  useCreateHRComplaint,
  useReplyHRComplaint,
  useCloseHRComplaint,
} from '@/hooks/api/useHR';
import { useCurrentHREmployee } from '@/hooks/api/useHR';
import { HR_COMPLAINT_STATUS } from '@/constants/hr.enums';
import { getEnumLabel } from '@/constants/enums';
import type { HRComplaint, CreateHRComplaintDto, ReplyHRComplaintDto } from '@/types/hr.types';

const { TextArea } = Input;

const STATUS_COLORS: Record<number, string> = { 1: 'processing', 2: 'success', 3: 'default' };

export default function HRComplaintsPage() {
  const [createForm] = Form.useForm();
  const [replyForm] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const userId = useAuthStore((s) => s.userId);
  const isAr = language === 'ar';

  const [createOpen, setCreateOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [selected, setSelected] = useState<HRComplaint | null>(null);

  const { data: complaints = [], isLoading } = useHRComplaints();
  const { data: currentEmployee } = useCurrentHREmployee(userId);
  const { mutate: createComplaint, isPending: creating } = useCreateHRComplaint();
  const { mutate: replyComplaint, isPending: replying } = useReplyHRComplaint();
  const { mutate: closeComplaint } = useCloseHRComplaint();

  useEffect(() => {
    if (currentEmployee && createOpen) {
      createForm.setFieldValue('employeeId', currentEmployee.id);
    }
  }, [currentEmployee, createOpen, createForm]);

  const handleCreate = (values: CreateHRComplaintDto) => {
    createComplaint(values, {
      onSuccess: () => {
        createForm.resetFields();
        setCreateOpen(false);
      },
    });
  };

  const handleReply = (values: { replyNotes: string; sendReplyTo?: string }) => {
    if (!selected) return;
    const dto: ReplyHRComplaintDto = {
      id: selected.id,
      replyNotes: values.replyNotes,
      sendReplyTo: values.sendReplyTo,
    };
    replyComplaint(dto, {
      onSuccess: () => {
        replyForm.resetFields();
        setReplyOpen(false);
        setSelected(null);
      },
    });
  };

  const openReply = (record: HRComplaint) => {
    setSelected(record);
    setReplyOpen(true);
  };

  const columns: ColumnsType<HRComplaint> = [
    { title: '#', dataIndex: 'id', width: 60 },
    { title: isAr ? 'الموظف' : 'Employee', dataIndex: 'employeeName' },
    { title: isAr ? 'رقم الموظف' : 'Emp. No.', dataIndex: 'employeeNumber', width: 110 },
    {
      title: isAr ? 'نص الشكوى' : 'Complaint',
      dataIndex: 'complaintNotes',
      ellipsis: true,
    },
    {
      title: isAr ? 'موجهة إلى' : 'Sent To',
      dataIndex: 'sendTheComplaintTo',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'status',
      render: (v) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>
          {getEnumLabel(HR_COMPLAINT_STATUS, v, language)}
        </Tag>
      ),
    },
    {
      title: isAr ? 'الرد' : 'Reply',
      dataIndex: 'replyNotes',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'تاريخ الإنشاء' : 'Created',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: 'reply',
            icon: <MessageOutlined />,
            label: isAr ? 'رد' : 'Reply',
            onClick: () => openReply(record),
            disabled: record.status === 3,
          },
          {
            key: 'close',
            icon: <CheckCircleOutlined />,
            label: isAr ? 'إغلاق' : 'Close',
            onClick: () => closeComplaint(record.id),
            disabled: record.status === 3,
          },
          { type: 'divider' },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: isAr ? 'حذف' : 'Delete',
            danger: true,
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader
        title={isAr ? 'شكاوى الموظفين' : 'Employee Complaints'}
        icon={<WarningOutlined />}
        actions={[{
          key: 'new',
          label: isAr ? 'شكوى جديدة' : 'New Complaint',
          icon: <PlusOutlined />,
          onClick: () => setCreateOpen(true),
          loading: creating,
        }]}
      />

      <Table
        columns={columns}
        dataSource={complaints}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15 }}
        scroll={{ x: 900 }}
      />

      {/* Create Complaint Modal */}
      <Modal
        title={isAr ? 'تقديم شكوى جديدة' : 'Submit New Complaint'}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="employeeId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="sendTheComplaintTo"
            label={isAr ? 'إرسال إلى' : 'Send Complaint To'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <Input placeholder={isAr ? 'مدير الموارد البشرية' : 'HR Manager'} />
          </Form.Item>

          <Form.Item
            name="complaintNotes"
            label={isAr ? 'نص الشكوى' : 'Complaint Details'}
            rules={[
              { required: true, message: isAr ? 'مطلوب' : 'Required' },
              { min: 10, message: isAr ? 'على الأقل 10 أحرف' : 'Min 10 characters' },
            ]}
          >
            <TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setCreateOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={creating}>
                {isAr ? 'إرسال' : 'Submit'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Reply Complaint Modal */}
      <Modal
        title={isAr ? 'الرد على الشكوى' : 'Reply to Complaint'}
        open={replyOpen}
        onCancel={() => {
          setReplyOpen(false);
          setSelected(null);
        }}
        footer={null}
        destroyOnClose
      >
        {selected && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <p>
              <strong>{isAr ? 'الشكوى:' : 'Complaint:'}</strong> {selected.complaintNotes}
            </p>
            <p>
              <strong>{isAr ? 'من:' : 'From:'}</strong> {selected.employeeName}
            </p>
          </Card>
        )}

        <Form form={replyForm} layout="vertical" onFinish={handleReply}>
          <Form.Item
            name="replyNotes"
            label={isAr ? 'نص الرد' : 'Reply'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }, { min: 5 }]}
          >
            <TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="sendReplyTo" label={isAr ? 'إرسال الرد إلى' : 'Send Reply To'}>
            <Input placeholder={isAr ? 'اسم المستقبل' : 'Recipient name'} />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setReplyOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={replying}>
                {isAr ? 'إرسال الرد' : 'Send Reply'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
