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
  InputNumber,
  Switch,
  Tooltip,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useHRLeaveTypes } from '@/hooks/api/useHR';
import type { LeaveTypeDto, CreateLeaveTypeDto, UpdateLeaveTypeDto } from '@/types/hr.types';

const { Title } = Typography;

export default function HRLeaveTypesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeDto | null>(null);
  const [form] = Form.useForm();

  const {
    leaveTypes,
    isLoading,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    isCreating,
    isUpdating,
    isDeleting,
  } = useHRLeaveTypes();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, allowCarryForward: false, isPaid: true });
    setModalOpen(true);
  };

  const openEdit = (record: LeaveTypeDto) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      defaultDaysPerYear: record.defaultDaysPerYear,
      isActive: record.isActive,
      allowCarryForward: record.allowCarryForward,
      isPaid: record.isPaid,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const dto = values as CreateLeaveTypeDto | UpdateLeaveTypeDto;
    if (editing) {
      await updateLeaveType({ id: editing.id, data: dto as UpdateLeaveTypeDto });
    } else {
      await createLeaveType(dto as CreateLeaveTypeDto);
    }
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<LeaveTypeDto> = [
    {
      title: 'اسم نوع الإجازة',
      dataIndex: 'name',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'الأيام الافتراضية / سنة',
      dataIndex: 'defaultDaysPerYear',
      width: 160,
      render: (v) => `${v} يوم`,
    },
    {
      title: 'مدفوعة',
      dataIndex: 'isPaid',
      width: 90,
      render: (v) => (v ? <Tag color="success">مدفوعة</Tag> : <Tag color="default">غير مدفوعة</Tag>),
    },
    {
      title: 'ترحيل الرصيد',
      dataIndex: 'allowCarryForward',
      width: 120,
      render: (v) => (v ? <Tag color="blue">مسموح</Tag> : <Tag color="default">غير مسموح</Tag>),
    },
    {
      title: 'الحالة',
      dataIndex: 'isActive',
      width: 90,
      render: (v) => (v ? <Tag color="success">نشط</Tag> : <Tag color="error">معطّل</Tag>),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="تعديل">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="حذف نوع الإجازة"
              description={
                <>
                  هل تريد حذف <strong>{record.name}</strong>؟
                  <br />
                  <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                    تحذير: هذا حذف نهائي. يُفضّل تعطيل النوع بدلاً من حذفه.
                  </span>
                </>
              }
              onConfirm={() => deleteLeaveType(record.id)}
              okText="حذف"
              cancelText="إلغاء"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <TagsOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>أنواع الإجازات</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
          إضافة نوع إجازة
        </Button>
      </div>

      <Card>
        <Table<LeaveTypeDto>
          dataSource={leaveTypes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد أنواع إجازات — أضف نوعاً جديداً' }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'تعديل نوع الإجازة' : 'إضافة نوع إجازة جديد'}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        okText={editing ? 'حفظ' : 'إضافة'}
        cancelText="إلغاء"
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="اسم نوع الإجازة"
            rules={[{ required: true, message: 'الاسم مطلوب' }]}
          >
            <Input placeholder="مثال: إجازة سنوية" />
          </Form.Item>

          <Form.Item
            name="defaultDaysPerYear"
            label="عدد الأيام الافتراضية في السنة"
            rules={[{ required: true, message: 'عدد الأيام مطلوب' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="21" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item name="isPaid" label="إجازة مدفوعة" valuePropName="checked">
                <Switch checkedChildren="مدفوعة" unCheckedChildren="غير مدفوعة" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="allowCarryForward" label="ترحيل الرصيد" valuePropName="checked">
                <Switch checkedChildren="مسموح" unCheckedChildren="غير مسموح" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="isActive" label="الحالة" valuePropName="checked">
                <Switch checkedChildren="نشط" unCheckedChildren="معطّل" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
